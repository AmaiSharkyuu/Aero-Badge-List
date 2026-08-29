const DEFAULT_SETTINGS = {
    ablEnabled: true,
    americanDates: false,
    ablCloudKeys: [""],
    ablShutUpKeyWarning: false,
};

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({
        url: "https://www.roblox.com/my/account?abl=general-settings"
    });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(null, (data) => {
        const toSet = {};

        for (const key in DEFAULT_SETTINGS) {
            if (data[key] === undefined) {
                toSet[key] = DEFAULT_SETTINGS[key];
            }
        }

        if (Object.keys(toSet).length > 0) {
            chrome.storage.local.set(toSet);
        }
    });
});