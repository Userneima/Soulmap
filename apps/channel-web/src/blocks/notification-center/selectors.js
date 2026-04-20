const interactionItems = [
    {
        id: "notice-1",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMEcp_Gb2H95x3OK1WiHC-EzuWE003ywUAtg9SEVazxij0OCuoZ50_DrAn602n1xUaJmFqPITtx0LAknqLJzjQz9eO6w6a9Ak9r77Qp9_EzQPiKdoNVrvoQ1LaimRB6o8UOT5Q_WRzhrKcmgvZYNePZUUiORLaFawGrWHI_8yS8gqV-JuBxX9sDrx2FEr1gcRL1qlAoW9oXheuh309Vm9ygZmwKzVA8_iJS66DcBDj1vo1aetR7EVQKdABFPiEu_vlhKfkrn0ArYk",
        userName: "我不是上帝",
        dateLabel: "2026.04.13",
        actionLine: "评论了我的帖子： 那很好了",
        quoteLine: "管理员：可以直接在这发自己的内容...",
        primaryAction: "赞",
        secondaryAction: "回复"
    },
    {
        id: "notice-2",
        avatar: "https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=120&q=80",
        userName: "主公请受我一拜",
        dateLabel: "2026.04.13",
        actionLine: "评论了我的帖子： 好诶 [动画表情]",
        quoteLine: "管理员：可以直接在这发自己的内容...",
        primaryAction: "赞",
        secondaryAction: "回复"
    },
    {
        id: "notice-3",
        avatar: "https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=120&q=80",
        userName: "主公请受我一拜",
        dateLabel: "2026.04.13",
        actionLine: "赞了我的帖子： ❤️",
        quoteLine: "管理员：可以直接在这发自己的内容...",
        primaryAction: "赞",
        secondaryAction: "回复"
    }
];

const adminItems = [
    {
        id: "admin-1",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD7dADvgkUZTmxeXdVrXRGz76Ic6R6Wd6I4KZ1sPj4qgDDug3FSXbt2MHfAjLymGrdxs1loOM-lwzNDWfpjTfON7UuMTrWPl053BjvRGm_VZdQLUtD9KvLKwjz03l_X740oiKoRp8XGKaK_swULjXNS4iVPZr2Oult7W_RibE_RDDkx_dg75u32hmhdVNzVPyVRbrBVe9bJt0Utq1RZTnetWnhQFsWzK7GZYVWtLQsMrGURY_piyy7q5wJq2TUz2sc2IWSw6UTn2wE",
        userName: "频道系统",
        dateLabel: "2026.04.13",
        actionLine: "你创建的频道已开放公开浏览",
        quoteLine: "频道现在处于演示模式，成员可继续进入浏览。"
    },
    {
        id: "admin-2",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMEcp_Gb2H95x3OK1WiHC-EzuWE003ywUAtg9SEVazxij0OCuoZ50_DrAn602n1xUaJmFqPITtx0LAknqLJzjQz9eO6w6a9Ak9r77Qp9_EzQPiKdoNVrvoQ1LaimRB6o8UOT5Q_WRzhrKcmgvZYNePZUUiORLaFawGrWHI_8yS8gqV-JuBxX9sDrx2FEr1gcRL1qlAoW9oXheuh309Vm9ygZmwKzVA8_iJS66DcBDj1vo1aetR7EVQKdABFPiEu_vlhKfkrn0ArYk",
        userName: "频道系统",
        dateLabel: "2026.04.12",
        actionLine: "你的频道菜单和身份系统已恢复",
        quoteLine: "当前版本适合直接演示主要体验。"
    }
];

const DESKTOP_BREAKPOINT = 720;
const NOTIFICATION_PANEL_WIDTH = 302;
const NOTIFICATION_PANEL_HEIGHT = 396;
const VIEWPORT_MARGIN = 12;

const getNotificationPanelStyle = (overlayState) => {
    if (typeof window === "undefined" || window.innerWidth <= DESKTOP_BREAKPOINT) {
        return "";
    }

    const { anchorX, anchorY } = overlayState;
    if (typeof anchorX !== "number" || typeof anchorY !== "number") {
        return "";
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxLeft = Math.max(VIEWPORT_MARGIN, viewportWidth - NOTIFICATION_PANEL_WIDTH - VIEWPORT_MARGIN);
    const maxTop = Math.max(VIEWPORT_MARGIN, viewportHeight - NOTIFICATION_PANEL_HEIGHT - VIEWPORT_MARGIN);
    const left = Math.min(maxLeft, Math.max(VIEWPORT_MARGIN, anchorX - NOTIFICATION_PANEL_WIDTH));
    const top = Math.min(maxTop, Math.max(VIEWPORT_MARGIN, anchorY));

    return `top:${top}px;left:${left}px;right:auto;`;
};

export const selectNotificationCenterVM = (state) => ({
    open: state.overlayState.notificationCenter.open,
    panelStyle: getNotificationPanelStyle(state.overlayState.notificationCenter),
    activeTab: state.overlayState.notificationCenter.tab,
    tabs: [
        { key: "interaction", label: "互动消息" },
        { key: "admin", label: "管理消息" }
    ],
    items: state.overlayState.notificationCenter.tab === "admin" ? adminItems : interactionItems
});
