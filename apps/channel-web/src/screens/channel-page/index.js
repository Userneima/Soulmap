import { channelPageTemplate } from "./template.js";
import { mountSidebarNavBlock } from "../../blocks/sidebar-nav/index.js";
import { mountChannelHeroBlock } from "../../blocks/channel-hero/index.js";
import { mountBoardTabsBlock } from "../../blocks/board-tabs/index.js";
import { mountComposerPanelBlock } from "../../blocks/composer-panel/index.js";
import { mountFeedListBlock } from "../../blocks/feed-list/index.js";
import { mountJoinRequestPanelBlock } from "../../blocks/join-request-panel/index.js";
import { mountMembershipReviewPanelBlock } from "../../blocks/membership-review-panel/index.js";
import { mountCommentDrawerBlock } from "../../blocks/comment-drawer/index.js";
import { mountNotificationCenterBlock } from "../../blocks/notification-center/index.js";
import { mountChannelMenuDialogBlock } from "../../blocks/channel-menu-dialog/index.js";
import { mountIdentityDialogBlock } from "../../blocks/identity-dialog/index.js";
import { mountAuthGateBlock } from "../../blocks/auth-gate/index.js";
import { mountSystemFeedbackBlock } from "../../blocks/system-feedback/index.js";

export const mountChannelPage = ({ root, store, actions }) => {
    root.innerHTML = channelPageTemplate();

    const blockSlots = {
        sidebarNav: root.querySelector('[data-screen-slot="sidebar-nav"]'),
        channelHero: root.querySelector('[data-screen-slot="channel-hero"]'),
        boardTabs: root.querySelector('[data-screen-slot="board-tabs"]'),
        joinRequestPanel: root.querySelector('[data-screen-slot="join-request-panel"]'),
        membershipReviewPanel: root.querySelector('[data-screen-slot="membership-review-panel"]'),
        composerPanel: root.querySelector('[data-screen-slot="composer-panel"]'),
        feedList: root.querySelector('[data-screen-slot="feed-list"]'),
        commentDrawer: root.querySelector('[data-screen-slot="comment-drawer"]'),
        notificationCenter: root.querySelector('[data-screen-slot="notification-center"]'),
        channelMenuDialog: root.querySelector('[data-screen-slot="channel-menu-dialog"]'),
        identityDialog: root.querySelector('[data-screen-slot="identity-dialog"]'),
        authGate: root.querySelector('[data-screen-slot="auth-gate"]'),
        systemFeedback: root.querySelector('[data-screen-slot="system-feedback"]')
    };

    const screenRoot = root.querySelector("[data-screen-root]");

    const blocks = [
        mountSidebarNavBlock({ root: blockSlots.sidebarNav, store, actions }),
        mountChannelHeroBlock({ root: blockSlots.channelHero, store, actions }),
        mountBoardTabsBlock({ root: blockSlots.boardTabs, store, actions }),
        mountJoinRequestPanelBlock({ root: blockSlots.joinRequestPanel, store, actions }),
        mountMembershipReviewPanelBlock({ root: blockSlots.membershipReviewPanel, store, actions }),
        mountComposerPanelBlock({ root: blockSlots.composerPanel, store, actions }),
        mountFeedListBlock({ root: blockSlots.feedList, store, actions }),
        mountCommentDrawerBlock({ root: blockSlots.commentDrawer, store, actions }),
        mountNotificationCenterBlock({ root: blockSlots.notificationCenter, store, actions }),
        mountChannelMenuDialogBlock({ root: blockSlots.channelMenuDialog, store, actions }),
        mountIdentityDialogBlock({ root: blockSlots.identityDialog, store, actions }),
        mountAuthGateBlock({ root: blockSlots.authGate, store, actions }),
        mountSystemFeedbackBlock({ root: blockSlots.systemFeedback, store, actions })
    ];

    const renderAll = () => {
        const state = store.getState();
        screenRoot?.classList.toggle("channel-page--condensed", state.uiState.topRegion === "condensed");
        blocks.forEach((block) => {
            block.render();
        });
    };

    let resizeTimeout = null;
    const syncViewportState = () => {
        actions.syncTopRegion(window.scrollY);
        if (window.innerWidth > 1080) {
            actions.setSidebarOpen(false);
        }
    };

    window.addEventListener("scroll", () => {
        actions.syncTopRegion(window.scrollY);
    }, { passive: true });

    window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(syncViewportState, 60);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }
        actions.closeOverlay("comments");
        actions.closeOverlay("notification-center");
        actions.closeOverlay("channel-menu");
        actions.closeOverlay("identity");
        actions.closeOverlay("auth-gate");
        actions.setSidebarOpen(false);
        actions.setAccountMenuOpen(false);
        actions.hideToast();
    });

    store.subscribe(() => {
        renderAll();
    });

    syncViewportState();
    renderAll();
};
