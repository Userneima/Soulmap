import { getPostBodyText, getPostPreviewText } from "./helpers.js";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const SUMMARY_MIN_TEXT_LENGTH = 90;
const TOPIC_STOPWORDS = new Set([
    "这个", "那个", "这里", "那里", "我们", "你们", "他们", "自己", "大家", "现在", "已经", "还有", "然后", "如果",
    "因为", "所以", "但是", "不过", "以及", "还是", "就是", "不是", "一个", "一种", "一些", "一下", "时候", "事情",
    "内容", "问题", "感觉", "觉得", "其实", "可能", "真的", "比较", "需要", "应该", "可以", "直接", "继续", "目前",
    "当前", "这样", "那样", "这个项目", "这个频道", "帖子", "评论", "频道", "讨论", "成员", "大家都", "我们都", "一下子",
    "很多", "没有", "什么", "怎么", "为什么", "是否", "还是要", "为了", "以及", "本周", "最近", "代表", "高频", "相关"
]);
const SUPPORT_MARKERS = ["支持", "赞同", "同意", "建议", "可以", "适合", "值得", "先", "优先", "倾向", "最好"];
const CAUTION_MARKERS = ["但是", "不过", "担心", "风险", "问题", "成本", "复杂", "不要", "不能", "仍然", "卡住", "取舍", "门槛"];
const QUESTION_MARKERS = ["?", "？", "如何", "为什么", "是否", "能不能", "要不要", "怎么办", "哪里", "谁来", "什么时候"];
const TOPIC_PREFIX_PATTERNS = [
    /^(我想|想|我们|大家|这边)?(继续)?(讨论|聊聊|看看|确认|整理|补充|聚焦|推进)/,
    /^(关于|围绕|对于)/,
    /^(要不要|能不能|是否|为什么|如何)/,
    /^(这次|这周|最近)(先|继续)?/
];

const normalizeText = (value) => String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[。！？!?；;]+/g, (match) => `${match[0]} `)
    .trim();

const clipText = (value, maxLength = 42) => {
    const normalized = normalizeText(value);
    if (normalized.length <= maxLength) {
        return normalized;
    }
    return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

const splitIntoSentences = (value) => normalizeText(value)
    .split(/(?<=[。！？!?；;])\s+|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

const countMarkerHits = (value, markers) => markers.reduce((count, marker) => (
    value.includes(marker) ? count + 1 : count
), 0);

const toTokenSet = (value) => new Set(extractTokens(value));

const getSharedTokenMetrics = (leftSet, rightSet) => {
    const shared = [...leftSet].filter((token) => rightSet.has(token));
    return {
        shared,
        ratio: shared.length / Math.max(leftSet.size, rightSet.size, 1)
    };
};

const extractTokens = (value) => {
    const tokens = [];
    const normalized = normalizeText(value);
    const latinTokens = normalized.toLowerCase().match(/[a-z0-9][a-z0-9-]{2,}/g) || [];
    latinTokens.forEach((token) => {
        if (!TOPIC_STOPWORDS.has(token)) {
            tokens.push(token);
        }
    });

    const hanRuns = normalized.match(/[\u4e00-\u9fff]{2,}/g) || [];
    hanRuns.forEach((run) => {
        const maxSize = Math.min(4, run.length);
        for (let size = 2; size <= maxSize; size += 1) {
            for (let index = 0; index <= run.length - size; index += 1) {
                const token = run.slice(index, index + size);
                if (!TOPIC_STOPWORDS.has(token)) {
                    tokens.push(token);
                }
            }
        }
    });

    return tokens;
};

const rankKeywords = (texts, limit = 6) => {
    const scoreByToken = new Map();
    const documentFrequency = new Map();

    texts.forEach((text) => {
        const tokens = extractTokens(text);
        const uniqueTokens = new Set(tokens);
        tokens.forEach((token) => {
            scoreByToken.set(token, (scoreByToken.get(token) || 0) + Math.max(1, token.length - 1));
        });
        uniqueTokens.forEach((token) => {
            documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
        });
    });

    const ranked = [...scoreByToken.entries()]
        .map(([token, score]) => ({
            token,
            score: score + ((documentFrequency.get(token) || 0) * 2),
            documents: documentFrequency.get(token) || 0
        }))
        .filter((item) => item.token.length >= 2)
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score;
            }
            if (right.documents !== left.documents) {
                return right.documents - left.documents;
            }
            return right.token.length - left.token.length;
        });

    return ranked.reduce((selected, candidate) => {
        if (selected.length >= limit) {
            return selected;
        }

        const overlaps = selected.some((item) => item.token.includes(candidate.token) || candidate.token.includes(item.token));
        if (!overlaps) {
            selected.push(candidate);
        }
        return selected;
    }, []);
};

const buildTopicLabel = (sentence) => {
    let label = normalizeText(sentence)
        .replace(/[。！？!?；;,:：]+$/g, "")
        .replace(/^(我觉得|我认为|我想|想|我们要不要|我们是不是|大家要不要|大家是不是)/, "")
        .trim();

    TOPIC_PREFIX_PATTERNS.forEach((pattern) => {
        label = label.replace(pattern, "").trim();
    });

    label = label
        .replace(/^(把|将|对|给)/, "")
        .replace(/^(一下|一遍)/, "")
        .trim();

    if (!label) {
        label = normalizeText(sentence).replace(/[。！？!?；;,:：]+$/g, "");
    }

    return clipText(label, 20);
};

const getPostTimestamp = (post) => {
    const timestamp = Date.parse(post?.createdAt || "");
    return Number.isNaN(timestamp) ? null : timestamp;
};

const buildRepresentativeSentencePool = (text) => {
    const sentences = splitIntoSentences(text);
    if (!sentences.length) {
        return [];
    }

    const keywordScoreByToken = new Map(rankKeywords([text], 12).map((item) => [item.token, item.score]));
    return sentences.map((sentence, index) => {
        const uniqueTokens = new Set(extractTokens(sentence));
        const keywordScore = [...uniqueTokens].reduce((score, token) => score + (keywordScoreByToken.get(token) || 0), 0);
        const questionBonus = countMarkerHits(sentence, QUESTION_MARKERS) > 0 ? 4 : 0;
        const positionBonus = Math.max(0, 6 - index);
        const lengthBonus = sentence.length >= 12 && sentence.length <= 48 ? 3 : 0;
        return {
            sentence,
            index,
            score: keywordScore + questionBonus + positionBonus + lengthBonus
        };
    });
};

export const buildPostThreeLineSummary = (post) => {
    const fullText = getPostBodyText(post);
    if (normalizeText(fullText).length < SUMMARY_MIN_TEXT_LENGTH) {
        return [];
    }

    const sentencePool = buildRepresentativeSentencePool(fullText);
    if (!sentencePool.length) {
        return [];
    }

    const selected = [...sentencePool]
        .sort((left, right) => right.score - left.score)
        .slice(0, 3)
        .sort((left, right) => left.index - right.index)
        .map((item) => clipText(item.sentence, 46));

    if (selected.length < 3) {
        const existing = new Set(selected);
        sentencePool.forEach((item) => {
            if (selected.length >= 3) {
                return;
            }
            const clipped = clipText(item.sentence, 46);
            if (!existing.has(clipped)) {
                selected.push(clipped);
                existing.add(clipped);
            }
        });
    }

    return selected.slice(0, 3);
};

export const buildCommentThreadSummary = (post) => {
    const liveComments = (post?.comments || []).filter((comment) => !comment.isDeleted && normalizeText(comment.text));
    if (!liveComments.length) {
        return null;
    }

    const texts = [getPostBodyText(post), ...liveComments.map((comment) => comment.text)];
    const topKeywords = rankKeywords(texts, 3).map((item) => item.token);
    const topicLine = topKeywords.length
        ? `主要在讨论 ${topKeywords.join("、")}。`
        : "主要在围绕原帖判断和执行方式继续展开。";

    const commentScores = liveComments.map((comment, index) => {
        const supportHits = countMarkerHits(comment.text, SUPPORT_MARKERS);
        const cautionHits = countMarkerHits(comment.text, CAUTION_MARKERS);
        const questionHits = countMarkerHits(comment.text, QUESTION_MARKERS);
        return {
            ...comment,
            index,
            supportScore: supportHits + ((comment.likes || 0) * 0.4),
            cautionScore: cautionHits + questionHits + ((comment.likes || 0) * 0.25)
        };
    });

    const consensusCandidate = [...commentScores]
        .sort((left, right) => right.supportScore - left.supportScore || right.likes - left.likes || left.index - right.index)[0];
    const unresolvedCandidate = [...commentScores]
        .sort((left, right) => right.cautionScore - left.cautionScore || right.likes - left.likes || left.index - right.index)[0];

    const supportTotal = commentScores.reduce((count, item) => count + item.supportScore, 0);
    const cautionTotal = commentScores.reduce((count, item) => count + item.cautionScore, 0);

    const consensusLine = supportTotal > cautionTotal && consensusCandidate?.text
        ? `相对共识：${clipText(consensusCandidate.text, 48)}`
        : "暂时共识还不稳定，更多是在补充各自判断。";

    const unresolvedLine = unresolvedCandidate?.text && unresolvedCandidate.text !== consensusCandidate?.text
        ? `还没解决：${clipText(unresolvedCandidate.text, 48)}`
        : "还没解决：需要更多具体案例、边界条件或执行顺序。";

    return {
        topicLine,
        consensusLine,
        unresolvedLine,
        commentCount: liveComments.length
    };
};

const getPostKeywordSet = (post) => {
    const texts = [
        getPostBodyText(post),
        ...(post.comments || []).filter((comment) => !comment.isDeleted).map((comment) => comment.text)
    ];
    const counts = new Map();
    texts.forEach((text) => {
        extractTokens(text).forEach((token) => {
            counts.set(token, (counts.get(token) || 0) + 1);
        });
    });

    return new Set(
        [...counts.entries()]
            .sort((left, right) => right[1] - left[1] || right[0].length - left[0].length)
            .slice(0, 16)
            .map(([token]) => token)
    );
};

export const findRelatedPosts = (targetPost, allPosts, limit = 3) => {
    const targetKeywords = getPostKeywordSet(targetPost);
    if (!targetKeywords.size) {
        return [];
    }

    const targetTimestamp = getPostTimestamp(targetPost);
    const targetIndex = allPosts.findIndex((post) => post.id === targetPost.id);

    const ranked = allPosts
        .filter((candidate, index) => {
            if (!candidate || candidate.id === targetPost.id || candidate.isDeleted) {
                return false;
            }

            const candidateTimestamp = getPostTimestamp(candidate);
            if (targetTimestamp !== null && candidateTimestamp !== null) {
                return candidateTimestamp <= targetTimestamp;
            }

            return targetIndex >= 0 ? index > targetIndex : true;
        })
        .map((candidate) => {
            const candidateKeywords = getPostKeywordSet(candidate);
            const sharedKeywords = [...targetKeywords].filter((token) => candidateKeywords.has(token)).slice(0, 3);
            const similarity = sharedKeywords.length / Math.max(targetKeywords.size, candidateKeywords.size, 1);
            return {
                candidate,
                sharedKeywords,
                similarity
            };
        })
        .filter((item) => item.sharedKeywords.length >= 2 || item.similarity >= 0.12)
        .sort((left, right) => right.similarity - left.similarity);

    return ranked.slice(0, limit).map(({ candidate, sharedKeywords }) => ({
        id: candidate.id,
        authorName: candidate.authorName || "频道成员",
        timeLabel: candidate.timeLabel || candidate.dateLabel || "",
        previewText: getPostPreviewText(candidate, 58).text,
        sharedKeywords
    }));
};

const getRecentPosts = (posts, now = Date.now()) => {
    const visiblePosts = posts.filter((post) => !post.isDeleted);
    const datedPosts = visiblePosts.filter((post) => getPostTimestamp(post) !== null);
    if (!datedPosts.length) {
        return visiblePosts.slice(0, 12);
    }

    const recentPosts = datedPosts.filter((post) => now - getPostTimestamp(post) <= MS_PER_WEEK);
    return recentPosts.length ? recentPosts : [...datedPosts]
        .sort((left, right) => getPostTimestamp(right) - getPostTimestamp(left))
        .slice(0, 12);
};

const buildWeeklyThemes = (posts) => {
    const candidates = [];

    posts.forEach((post) => {
        const sourceTexts = [
            getPostBodyText(post),
            ...((post.comments || []).filter((comment) => !comment.isDeleted).map((comment) => comment.text))
        ];

        sourceTexts.forEach((text, sourceIndex) => {
            splitIntoSentences(text).forEach((sentence, sentenceIndex) => {
                const tokenSet = toTokenSet(sentence);
                if (tokenSet.size < 2 || sentence.length < 8) {
                    return;
                }

                const supportBonus = countMarkerHits(sentence, SUPPORT_MARKERS) * 0.8;
                const questionBonus = countMarkerHits(sentence, QUESTION_MARKERS) * 1.1;
                const cautionBonus = countMarkerHits(sentence, CAUTION_MARKERS) * 0.9;
                const score = tokenSet.size + supportBonus + questionBonus + cautionBonus + Math.max(0, 3 - sentenceIndex) - (sourceIndex * 0.1);

                candidates.push({
                    rawText: sentence,
                    label: buildTopicLabel(sentence),
                    tokenSet,
                    score
                });
            });
        });
    });

    const rankedCandidates = candidates
        .sort((left, right) => right.score - left.score)
        .filter((candidate) => candidate.label.length >= 4);

    const clusters = [];

    rankedCandidates.forEach((candidate) => {
        const matchedCluster = clusters.find((cluster) => {
            const { shared, ratio } = getSharedTokenMetrics(candidate.tokenSet, cluster.tokenSet);
            return shared.length >= 2 || ratio >= 0.34;
        });

        if (!matchedCluster) {
            clusters.push({
                label: candidate.label,
                tokenSet: new Set(candidate.tokenSet),
                mentionCount: 1,
                score: candidate.score,
                examples: [candidate.rawText]
            });
            return;
        }

        candidate.tokenSet.forEach((token) => matchedCluster.tokenSet.add(token));
        matchedCluster.mentionCount += 1;
        matchedCluster.score += candidate.score;
        matchedCluster.examples.push(candidate.rawText);
        if (candidate.score > matchedCluster.score / matchedCluster.mentionCount) {
            matchedCluster.label = candidate.label;
        }
    });

    return clusters
        .sort((left, right) => {
            if (right.mentionCount !== left.mentionCount) {
                return right.mentionCount - left.mentionCount;
            }
            return right.score - left.score;
        })
        .reduce((selected, cluster) => {
            if (selected.length >= 4) {
                return selected;
            }

            const hasNearDuplicate = selected.some((item) => item.label.includes(cluster.label) || cluster.label.includes(item.label));
            if (!hasNearDuplicate) {
                selected.push({
                    label: cluster.label,
                    mentionCount: cluster.mentionCount
                });
            }
            return selected;
        }, []);
};

const collectOpenQuestions = (posts) => {
    const candidates = [];
    posts.forEach((post) => {
        const sourceTexts = [
            { text: getPostBodyText(post), likes: post.likes || 0, authorName: post.authorName || "频道成员" },
            ...((post.comments || []).filter((comment) => !comment.isDeleted).map((comment) => ({
                text: comment.text,
                likes: comment.likes || 0,
                authorName: comment.authorName || "频道成员"
            })))
        ];

        sourceTexts.forEach((item) => {
            const cautionHits = countMarkerHits(item.text, [...CAUTION_MARKERS, ...QUESTION_MARKERS]);
            if (cautionHits === 0) {
                return;
            }

            candidates.push({
                text: clipText(item.text, 44),
                score: cautionHits + (item.likes * 0.4),
                authorName: item.authorName
            });
        });
    });

    return candidates
        .sort((left, right) => right.score - left.score)
        .reduce((selected, candidate) => {
            if (selected.length >= 3) {
                return selected;
            }
            if (!selected.some((item) => item.text === candidate.text)) {
                selected.push(candidate);
            }
            return selected;
        }, []);
};

export const buildWeeklyDigest = (posts, now = Date.now()) => {
    const recentPosts = getRecentPosts(posts, now);
    if (!recentPosts.length) {
        return {
            status: "empty",
            totalPosts: 0,
            totalComments: 0,
            topThemes: [],
            representativePosts: [],
            openQuestions: []
        };
    }

    const totalComments = recentPosts.reduce((count, post) => count + ((post.comments || []).filter((comment) => !comment.isDeleted).length), 0);
    const topThemes = buildWeeklyThemes(recentPosts);

    const representativePosts = [...recentPosts]
        .map((post, index) => ({
            ...post,
            score: ((post.likes || 0) * 3) + (((post.comments || []).filter((comment) => !comment.isDeleted).length) * 2) + ((post.views || 0) / 20) - index
        }))
        .sort((left, right) => right.score - left.score)
        .slice(0, 3)
        .map((post) => ({
            id: post.id,
            authorName: post.authorName || "频道成员",
            timeLabel: post.timeLabel || post.dateLabel || "",
            previewText: getPostPreviewText(post, 60).text
        }));

    return {
        status: "ready",
        totalPosts: recentPosts.length,
        totalComments,
        topThemes,
        representativePosts,
        openQuestions: collectOpenQuestions(recentPosts)
    };
};
