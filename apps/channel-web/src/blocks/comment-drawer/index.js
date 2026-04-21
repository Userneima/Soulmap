import "./styles.css";
import { attachCommentDrawerEvents } from "./events.js";
import { selectCommentDrawerVM } from "./selectors.js";
import { commentDrawerTemplate } from "./template.js";

export const mountCommentDrawerBlock = ({ root, store, actions }) => {
    let refs = null;
    let hasBoundEvents = false;
    let lastOpenSignature = "";
    let previousVm = null;

    const ensureRefs = () => {
        refs = {
            drawer: root.querySelector(".comment-drawer"),
            body: root.querySelector(".comment-drawer__body"),
            postBody: root.querySelector("[data-ref='post-body']"),
            commentsSection: root.querySelector("[data-ref='comments-section']"),
            input: root.querySelector("[data-ref='comment-input']"),
            send: root.querySelector("[data-comments-action='send']")
        };
        if (!hasBoundEvents) {
            attachCommentDrawerEvents({ root, actions });
            hasBoundEvents = true;
        }
    };

    return {
        render() {
            const vm = selectCommentDrawerVM(store.getState());
            const shouldRerender = !refs
                || root.innerHTML === ""
                || previousVm?.open !== vm.open
                || previousVm?.status !== vm.status
                || previousVm?.post?.id !== vm.post?.id
                || previousVm?.sort !== vm.sort
                || previousVm?.commentSignature !== vm.comments.map((comment) => `${comment.id}:${comment.parentCommentId || "root"}:${comment.likes || 0}:${comment.isLiked ? 1 : 0}`).join("|")
                || previousVm?.canInteract !== vm.canInteract
                || previousVm?.replyTarget?.id !== vm.replyTarget?.id
                || previousVm?.copyEnabled !== vm.copyEnabled
                || previousVm?.anonymousMode !== vm.anonymousMode
                || previousVm?.adminRevealAnonymous !== vm.adminRevealAnonymous
                || previousVm?.activeAlias?.key !== vm.activeAlias?.key
                || previousVm?.activeAlias?.name !== vm.activeAlias?.name
                || previousVm?.activeAlias?.avatar !== vm.activeAlias?.avatar;

            if (shouldRerender) {
                root.innerHTML = commentDrawerTemplate(vm);
                ensureRefs();
            }

            const activeElement = document.activeElement;
            const previousScrollTop = refs.body?.scrollTop || 0;

            if (refs.input && activeElement === refs.input) {
                refs.input.focus();
                refs.input.setSelectionRange(vm.draftText.length, vm.draftText.length);
            }

            if (refs.input && document.activeElement !== refs.input) {
                refs.input.value = vm.draftText;
            } else if (refs.input && refs.input.value !== vm.draftText) {
                refs.input.value = vm.draftText;
                refs.input.setSelectionRange(vm.draftText.length, vm.draftText.length);
            }

            if (refs.send) {
                refs.send.disabled = !vm.canSend;
                refs.send.textContent = vm.submitStatus === "submitting" ? "发送中" : "发送";
            }

            const nextSignature = vm.open ? `${vm.post?.id || ""}:${vm.openSource}:${vm.status}` : "";
            const shouldReposition = vm.open && vm.status === "ready" && nextSignature !== lastOpenSignature;
            if (shouldReposition && refs.body) {
                if (vm.openSource === "comments") {
                    const commentAnchorTop = refs.commentsSection?.offsetTop ?? 0;
                    refs.body.scrollTop = Math.max(0, commentAnchorTop - 24);
                    if (vm.canInteract && refs.input) {
                        refs.input.focus();
                        refs.input.setSelectionRange(vm.draftText.length, vm.draftText.length);
                    }
                } else {
                    refs.body.scrollTop = 0;
                }
            } else if (refs.body) {
                refs.body.scrollTop = previousScrollTop;
            }

            lastOpenSignature = nextSignature;
            previousVm = {
                ...vm,
                comments: [...vm.comments],
                commentSignature: vm.comments.map((comment) => `${comment.id}:${comment.parentCommentId || "root"}:${comment.likes || 0}:${comment.isLiked ? 1 : 0}`).join("|")
            };
        }
    };
};
