export const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const formatComposerTextForPost = (text) => escapeHtml(text)
    .replace(/(@[^\s@]+)/g, '<span class="text-accent">$1</span>')
    .replace(/\n/g, "<br/>");

export const getPostBodyText = (post) => post?.text ?? post?.fullText ?? "";

export const getPostPreviewText = (post, maxLength = 110) => {
    const fullText = getPostBodyText(post).trim();
    const normalizedText = fullText.replace(/\s+/g, " ");

    if (!normalizedText) {
        return {
            text: "",
            isTruncated: false
        };
    }

    if (normalizedText.length <= maxLength) {
        return {
            text: fullText,
            isTruncated: false
        };
    }

    const nextText = `${normalizedText.slice(0, maxLength).trimEnd()}...`;
    return {
        text: nextText,
        isTruncated: true
    };
};

export const readBlobAsDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

export const anonymizeComposerText = (rawText) => rawText
    .split("\n")
    .map((line) => line
        .replace(/我觉得/g, "换个角度看")
        .replace(/我认为/g, "更中性的看法是")
        .replace(/我想说/g, "想补充的是")
        .replace(/我想/g, "想")
        .replace(/我的/g, "相关")
        .replace(/我们/g, "大家")
        .replace(/我/g, "这边")
        .replace(/哈哈+/g, "哈哈")
        .replace(/[!！]{2,}/g, "！")
        .replace(/[?？]{2,}/g, "？")
    )
    .join("\n")
    .trim();

export const loadComposerImage = (url) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
});

export const cloneComposerImageForPost = async (image) => {
    const response = await fetch(image.url);
    const blob = await response.blob();
    return {
        id: image.id,
        name: image.name,
        url: await readBlobAsDataUrl(blob)
    };
};

export const processAnonymousImageForPost = async (image) => {
    const sourceImage = await loadComposerImage(image.url);
    const cropX = Math.round(sourceImage.naturalWidth * 0.02);
    const cropY = Math.round(sourceImage.naturalHeight * 0.02);
    const sourceWidth = Math.max(1, sourceImage.naturalWidth - cropX * 2);
    const sourceHeight = Math.max(1, sourceImage.naturalHeight - cropY * 2);
    const scale = Math.min(1, 1280 / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext("2d");
    context.filter = "blur(0.6px) saturate(0.94) contrast(1.02) brightness(1.01)";
    context.drawImage(sourceImage, cropX, cropY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.92);
    });
    return {
        id: image.id,
        name: image.name,
        url: await readBlobAsDataUrl(blob)
    };
};

export const createImageDraftFromFile = (file, nextId) => ({
    id: nextId,
    name: file.name,
    url: URL.createObjectURL(file)
});

export const revokeImageDrafts = (images) => {
    images.forEach((image) => {
        if (image?.url?.startsWith("blob:")) {
            URL.revokeObjectURL(image.url);
        }
    });
};

export const copyText = async (text) => {
    if (!navigator.clipboard) {
        throw new Error("Clipboard is not available.");
    }
    await navigator.clipboard.writeText(text);
};

export const delay = (duration) => new Promise((resolve) => {
    window.setTimeout(resolve, duration);
});

export const getChannelActionErrorMessage = (action, error) => {
    const code = String(error?.code || "");
    const message = String(error?.message || "");
    const lowerMessage = message.toLowerCase();

    if (code === "anonymous_provider_disabled") {
        return "频道暂时无法进入，Supabase 还没有开启匿名登录。";
    }

    if (code === "42501") {
        if (action === "init_runtime") {
            return "频道权限初始化没有完成，请稍后重试。";
        }
        return "当前操作被频道权限规则拦截，请刷新后重试。";
    }

    if (code === "PGRST116") {
        return "目标内容不存在，或者当前会话暂时无法读取它。";
    }

    if (code === "23505") {
        if (action === "submit_join_request") {
            return "你已经提交过待审核的申请了。";
        }
        return "数据已经存在，当前结果已保留。";
    }

    if (code === "42703" || code === "42P01" || code === "42883" || code === "PGRST202") {
        return "频道数据库还没完成升级，页面先按兼容模式打开。需要把最新 migration 应用到 Supabase。";
    }

    if (lowerMessage.includes("invalid login credentials")) {
        return action === "login_with_password"
            ? "账号或密码错误，请重试。"
            : "验证码无效或已过期，请重新获取。";
    }

    if (lowerMessage.includes("token has expired")) {
        return "验证码无效或已过期，请重新获取。";
    }

    if (lowerMessage.includes("email rate limit exceeded")) {
        return "验证码发送过于频繁，请稍后再试。";
    }

    if (lowerMessage.includes("email not confirmed")) {
        return "邮箱验证还没有完成，请先完成收件箱里的确认步骤。";
    }

    if (lowerMessage.includes("failed to fetch") || lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
        return "网络连接异常，请稍后再试。";
    }

    const fallbackMap = {
        init_runtime: "频道初始化失败，请重新尝试。",
        init_create_channel: "创建频道页初始化失败，请刷新后重试。",
        login_with_password: "登录失败，请检查账号和密码后重试。",
        logout: "退出登录失败，请稍后重试。",
        create_channel: "频道创建失败，请稍后重试。",
        send_login_otp: "验证码发送失败，请稍后重试。",
        verify_login_otp: "登录验证失败，请检查验证码后重试。",
        upgrade_legacy_account: "账号升级失败，请稍后重试。",
        publish_post: "帖子发送失败，草稿还保留着，可以直接重试。",
        publish_comment: "评论发送失败，请稍后重试。",
        update_identity: "昵称或头像保存失败，请稍后重试。",
        load_feed: "频道内容加载失败，请刷新或重试。",
        load_comments: "评论加载失败，请稍后重试。",
        submit_join_request: "加入申请提交失败，请稍后重试。",
        load_membership_reviews: "待审核列表加载失败，请稍后重试。",
        approve_join_request: "通过申请失败，请稍后重试。",
        reject_join_request: "拒绝申请失败，请稍后重试。",
        copy_post: "复制失败，请稍后重试。",
        read_avatar: "头像读取失败，请换一张图片再试。"
    };

    return fallbackMap[action] || "操作失败，请稍后重试。";
};
