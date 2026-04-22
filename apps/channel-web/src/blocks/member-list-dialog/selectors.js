import { mentionMembers } from "../../entities/identity/config.js";

const dedupeMembers = (members) => members.filter((member, index, list) => (
    list.findIndex((item) => item.name === member.name) === index
));

export const selectMemberListDialogVM = (state) => {
    const members = dedupeMembers(mentionMembers);

    return {
        open: state.overlayState.memberList.open,
        subtitle: `${members.length} 位当前社区成员`,
        members
    };
};
