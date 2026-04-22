import { escapeHtml } from "../../shared/lib/helpers.js";

export const channelHeroTemplate = (vm) => `
    <section class="channel-hero" style="${vm.heroStyle}">
        <div class="channel-hero__content">
            <div class="channel-hero__identity">
                <div class="channel-hero__logo-shell">
                    <img alt="${escapeHtml(vm.channelName)}" class="channel-hero__logo" src="${vm.logoUrl}" />
                </div>
                <div class="channel-hero__meta">
                    <h1 class="channel-hero__title">${escapeHtml(vm.channelName)}</h1>
                    <button class="channel-hero__subtitle" data-channel-hero-action="members" type="button">
                        <span class="material-icons-outlined">person</span>
                        <span>${escapeHtml(vm.memberCountLabel)}</span>
                    </button>
                </div>
            </div>
            <div class="channel-hero__actions">
                <button class="channel-hero__icon" data-channel-hero-action="search" type="button">
                    <span class="material-icons-outlined">search</span>
                </button>
                <button class="channel-hero__icon" data-channel-hero-action="notifications" type="button">
                    <span class="material-icons-outlined">mail</span>
                </button>
                <button class="channel-hero__icon" data-channel-hero-action="menu" type="button">
                    <span class="material-icons-outlined">menu</span>
                </button>
            </div>
        </div>
    </section>
`;
