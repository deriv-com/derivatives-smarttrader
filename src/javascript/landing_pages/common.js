// displays notification on outdated browsers
function outdatedBrowser() {
    const src = '//browser-update.org/update.min.js';
    if (document.querySelector(`script[src*="${src}"]`)) return;
    const el_message = document.getElementById('outdated_browser_message');
    const message = el_message ? el_message.innerHTML : 'Your web browser ({brow_name}) is out of date and may affect your trading experience. Proceed at your own risk. <a href="https://browsehappy.com/" target="_blank">Update browser</a>';
    window.$buoop = {
        vs      : { i: 11, f: -4, o: -4, s: 9, c: -4 },
        api     : 4,
        url     : 'https://browsehappy.com/',
        noclose : true, // Do not show the 'ignore' button to close the notification
        text    : message,
        reminder: 0, // show all the time
    };
    if (document.body) {
        const script = document.createElement('script');
        script.setAttribute('src', src);
        document.body.appendChild(script);
    }
}

window.addEventListener('load', () => { // being called before js code of each page
    outdatedBrowser();
});
