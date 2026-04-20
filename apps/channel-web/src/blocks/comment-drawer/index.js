import "./styles.css";
import { attachCommentDrawerEvents } from "./events.js";
import { selectCommentDrawerVM } from "./selectors.js";
import { commentDrawerTemplate } from "./template.js";

export const mountCommentDrawerBlock = ({ root, store, actions }) => {
    let refs = null;
    let hasBoundEvents = false;
    let lastOpenSignature = "";

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
            if (!refs) {
                root.innerHTML = commentDrawerTemplate(vm);
                ensureRefs();
                lastOpenSignature = vm.open ? `${vm.post?.id || vm.postId || ""}:${vm.openSource}:${vm.status}` : "";
                return;
            }

            const activeElement = document.activeElement;
            const previousScrollTop = refs.body?.scrollTop || 0;
            root.innerHTML = commentDrawerTemplate(vm);
            ensureRefs();

            if (refs.input && activeElement === refs.input) {
                refs.input.focus();
                refs.input.setSelectionRange(vm.draftText.length, vm.draftText.length);
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
        }
    };
};
