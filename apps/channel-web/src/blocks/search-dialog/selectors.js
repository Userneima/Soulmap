import { channelBoardChoices } from "../../entities/channel/config.js";
import { getPostBodyText, getPostPreviewText } from "../../shared/lib/helpers.js";

const normalizeSearchValue = (value) => String(value || "").trim().toLowerCase();

const buildSearchCorpus = (post) => [
    post.authorName,
    getPostBodyText(post),
    ...(post.comments || [])
        .filter((comment) => !comment.isDeleted)
        .map((comment) => comment.text)
].join(" ").toLowerCase();

const getBoardLabelMap = () => new Map([
    ["all", "全部版块"],
    ...channelBoardChoices.map((choice) => [choice.value, choice.label])
]);

const formatSearchDate = (createdAt, fallback = "") => {
    if (!createdAt) {
        return fallback;
    }

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
        return fallback;
    }

    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    const hours = `${date.getHours()}`.padStart(2, "0");
    const minutes = `${date.getMinutes()}`.padStart(2, "0");
    return `${month}-${day} ${hours}:${minutes}`;
};

const buildResultScore = (post, query) => {
    if (!query) {
        return 0;
    }

    const author = normalizeSearchValue(post.authorName);
    const body = normalizeSearchValue(getPostBodyText(post));
    const commentText = normalizeSearchValue((post.comments || []).map((comment) => comment.text).join(" "));
    let score = 0;

    if (author.includes(query)) {
        score += 6;
    }
    if (body.includes(query)) {
        score += 4;
    }
    if (commentText.includes(query)) {
        score += 2;
    }

    return score;
};

export const selectSearchDialogVM = (state) => {
    const overlayState = state.overlayState.searchDialog;
    const normalizedQuery = normalizeSearchValue(overlayState.query);
    const boardLabelMap = getBoardLabelMap();
    const baseItems = (overlayState.items || []).filter((post) => !post.isDeleted);
    const boardFilteredItems = overlayState.board === "all"
        ? baseItems
        : baseItems.filter((post) => post.board === overlayState.board);
    const queryFilteredItems = normalizedQuery
        ? boardFilteredItems.filter((post) => buildSearchCorpus(post).includes(normalizedQuery))
        : boardFilteredItems;

    const sortedItems = [...queryFilteredItems].sort((left, right) => {
        if (overlayState.sort === "newest") {
            return Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0);
        }

        const rightScore = buildResultScore(right, normalizedQuery);
        const leftScore = buildResultScore(left, normalizedQuery);
        if (rightScore !== leftScore) {
            return rightScore - leftScore;
        }
        return Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0);
    });

    return {
        open: overlayState.open,
        status: overlayState.status,
        query: overlayState.query,
        title: `搜索“${state.runtimeState.channel?.name || "频道"}”频道内容`,
        currentChannelName: state.runtimeState.channel?.name || "频道",
        board: overlayState.board,
        sort: overlayState.sort,
        boardChoices: [
            { value: "all", label: "版块筛选" },
            ...channelBoardChoices
        ],
        sortChoices: [
            { value: "relevant", label: "最相关" },
            { value: "newest", label: "最新发布" }
        ],
        error: typeof overlayState.error === "string"
            ? overlayState.error
            : overlayState.error?.message || "",
        empty: overlayState.status !== "loading" && sortedItems.length === 0,
        items: sortedItems.map((post) => ({
            id: post.id,
            authorName: post.authorName,
            authorAvatar: post.authorAvatar,
            previewText: getPostPreviewText(post, 180).text || getPostBodyText(post),
            boardLabel: boardLabelMap.get(post.board || "all") || "频道内容",
            createdAtLabel: formatSearchDate(post.createdAt, post.timeLabel),
            likes: post.likes || 0,
            commentCount: post.comments?.length || 0
        }))
    };
};
