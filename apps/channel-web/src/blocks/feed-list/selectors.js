import { getPostBodyText, getPostPreviewText } from "../../shared/lib/helpers.js";

const normalizeSearchValue = (value) => String(value || "").trim().toLowerCase();

const buildSearchCorpus = (post) => [
    post.authorName,
    getPostBodyText(post),
    ...(post.comments || []).map((comment) => comment.text)
].join(" ").toLowerCase();

export const selectFeedListVM = (state) => {
    const searchQuery = state.feedState.searchQuery || "";
    const normalizedSearchQuery = normalizeSearchValue(searchQuery);
    const likedPostIds = new Set(state.feedState.likedPostIds || []);
    const items = normalizedSearchQuery
        ? state.feedState.items.filter((post) => buildSearchCorpus(post).includes(normalizedSearchQuery))
        : state.feedState.items;

    const status = state.feedState.status === "ready" && !items.length && normalizedSearchQuery
        ? "search-empty"
        : state.feedState.status;

    return {
        status,
        items: items.map((post) => {
            const preview = getPostPreviewText(post);
            return {
                ...post,
                previewText: preview.text,
                isTruncated: preview.isTruncated,
                showFullEntry: preview.isTruncated,
                isLiked: likedPostIds.has(post.id)
            };
        }),
        searchQuery,
        error: typeof state.feedState.error === "string"
            ? state.feedState.error
            : state.feedState.error?.message || ""
    };
};
