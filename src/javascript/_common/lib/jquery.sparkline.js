vals = this.getAttribute(options.get('tagValuesAttribute'));
if (vals === undefined || vals === null) {
    vals = $this.html();
}
values = vals.replace(/(^\s*<!--)|(-->\s*$)/g, '').replace(/\s+/g, '').split(',');