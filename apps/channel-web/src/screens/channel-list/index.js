import "./styles.css";
import { escapeHtml } from "../../shared/lib/helpers.js";
import { runtimeConfig } from "../../shared/config/runtime-config.js";

const buildStatLabel = (count) => `${count} 条讨论`;

const getFallbackChannels = () => {
    if (!runtimeConfig.channelSlug) {
        return [];
    }

    return [{
        slug: runtimeConfig.channelSlug,
        name: runtimeConfig.channelName || runtimeConfig.channelSlug,
        description: "进入频道后即可查看讨论流、身份切换和最小互动闭环。",
        discussionCount: 0,
        badge: (runtimeConfig.channelName || runtimeConfig.channelSlug || "频").slice(0, 1)
    }];
};

const buildChannelCard = (channel) => `
    <a class="channel-directory__card" href="?channel=${encodeURIComponent(channel.slug)}">
        <div class="channel-directory__card-top">
            <div class="channel-directory__badge">${escapeHtml(channel.badge)}</div>
            <div class="channel-directory__meta">
                <h2>${escapeHtml(channel.name)}</h2>
                <p>${escapeHtml(channel.description || "进入频道后即可查看讨论流、身份切换和最小互动闭环。")}</p>
            </div>
        </div>
        <div class="channel-directory__footer">
            <span class="channel-directory__stat">${escapeHtml(buildStatLabel(channel.discussionCount || 0))}</span>
            <span class="channel-directory__enter">进入频道</span>
        </div>
    </a>
`;

const renderState = (root, title, description) => {
    root.innerHTML = `
        <div class="channel-directory">
            <header class="channel-directory__hero">
                    <div>
                        <div class="channel-directory__brand">Soulmap</div>
                        <h1>${escapeHtml(title)}</h1>
                        <p>${escapeHtml(description)}</p>
                    </div>
                </header>
        </div>
    `;
};

const renderDirectory = (root, channels) => {
    root.innerHTML = `
        <div class="channel-directory">
            <header class="channel-directory__hero">
                <div>
                    <div class="channel-directory__brand">Soulmap</div>
                    <h1>选择一个频道</h1>
                    <p>当前先保留最小频道能力：进入频道、查看讨论、发内容、做基础互动。</p>
                </div>
            </header>
            <section class="channel-directory__grid">
                ${channels.length
        ? channels.map((channel) => buildChannelCard(channel)).join("")
        : `
                        <div class="channel-directory__empty">
                            <h2>还没有可浏览的频道</h2>
                            <p>先创建一个公开频道，再回来演示完整流程。</p>
                        </div>
                    `}
            </section>
        </div>
    `;
};

export const mountChannelListPage = async ({ root, dataService }) => {
    const fallbackChannels = getFallbackChannels();
    if (fallbackChannels.length) {
        renderDirectory(root, fallbackChannels);
    } else {
        renderState(root, "选择一个频道", "先进入频道，再演示发帖、评论、身份切换和最小互动。");
    }

    try {
        const channels = await dataService.listPublicChannels();
        renderDirectory(root, channels);
    } catch (error) {
        if (!fallbackChannels.length) {
            renderState(root, "频道列表暂时不可用", error?.message || "公开频道读取失败，请稍后刷新。");
        }
    }
};
