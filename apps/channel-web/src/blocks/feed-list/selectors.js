import { getPostBodyText, getPostPreviewText } from "../../shared/lib/helpers.js";
import { mentionMembers } from "../../entities/identity/config.js";

const normalizeSearchValue = (value) => String(value || "").trim().toLowerCase();

const buildSearchCorpus = (post) => {
    if (post.isDeleted) {
        return "";
    }

    return [
        post.authorName,
        getPostBodyText(post),
        ...(post.comments || [])
            .filter((comment) => !comment.isDeleted)
            .map((comment) => comment.text)
    ].join(" ").toLowerCase();
};

export const selectFeedListVM = (state) => {
    const activeStage = state.roundState.activeStage;
    const searchQuery = state.feedState.searchQuery || "";
    const normalizedSearchQuery = normalizeSearchValue(searchQuery);
    const likedPostIds = new Set(state.feedState.likedPostIds || []);
    const currentUserId = state.authState.user?.id || null;
    const isClaimStage = state.roundState.activeStage === "claim";
    const claimSelection = state.roundState.claimSelection;
    const canManageAnonymous = ["owner", "admin"].includes(state.runtimeState.realIdentity.role);
    const showAdminReveal = canManageAnonymous && state.uiState.adminRevealAnonymous;
    const canModerateContent = state.membershipState.status === "approved" && canManageAnonymous;
    const selectedGuessTarget = state.composerState.mentionTarget || state.roundState.guessSelection || null;
    const guessExcludedNames = new Set(state.roundState.guessExcludedNames || []);

    if (activeStage === "guess") {
        const currentName = String(state.runtimeState.realIdentity.name || "").trim();
        const candidates = mentionMembers
            .filter((member) => member.name !== currentName)
            .map((member) => ({
                ...member,
                isSelected: selectedGuessTarget?.name === member.name,
                isExcluded: guessExcludedNames.has(member.name)
            }))
            .sort((left, right) => {
                if (left.isExcluded !== right.isExcluded) {
                    return left.isExcluded ? 1 : -1;
                }
                if (left.isSelected !== right.isSelected) {
                    return left.isSelected ? -1 : 1;
                }
                return 0;
            });

        return {
            mode: "guess-picker",
            status: "ready",
            candidates,
            selectedCandidate: selectedGuessTarget,
            excludedNames: [...guessExcludedNames],
            guessDraftText: state.composerState.draftText,
            submitStatus: state.composerState.submitStatus,
            canSubmitGuess: Boolean(selectedGuessTarget?.name)
        };
    }

    const visiblePosts = state.feedState.items.filter((post) => !post.isDeleted);
    const items = normalizedSearchQuery
        ? visiblePosts.filter((post) => buildSearchCorpus(post).includes(normalizedSearchQuery))
        : visiblePosts;

    const status = state.feedState.status === "ready" && !items.length && normalizedSearchQuery
        ? "search-empty"
        : state.feedState.status;

    return {
        mode: "feed",
        status,
        items: items.map((post) => {
            const preview = getPostPreviewText(post);
            const canDelete = !post.isDeleted && state.membershipState.status === "approved" && Boolean(currentUserId) && (
                post.authorUserId === currentUserId || canModerateContent
            );
            return {
                ...post,
                previewText: preview.text,
                isTruncated: preview.isTruncated,
                showFullEntry: preview.isTruncated && !post.isDeleted,
                isLiked: likedPostIds.has(post.id),
                showAdminReveal: Boolean(showAdminReveal && post.isAnonymous && post.adminRevealIdentity),
                canDelete,
                canClaimWish: isClaimStage
                    && state.membershipState.status === "approved"
                    && !post.isDeleted
                    && post.board === "wish"
                    && Boolean(currentUserId)
                    && post.authorUserId !== currentUserId,
                isClaimedWish: claimSelection?.postId === post.id,
                claimActionLabel: claimSelection?.postId === post.id
                    ? "已选中"
                    : claimSelection?.postId
                        ? "改选这个"
                        : "选这个愿望"
            };
        }),
        searchQuery,
        error: typeof state.feedState.error === "string"
            ? state.feedState.error
            : state.feedState.error?.message || ""
    };
};
