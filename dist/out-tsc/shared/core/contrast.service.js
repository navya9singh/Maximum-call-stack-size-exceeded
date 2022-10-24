import { __decorate, __metadata } from "tslib";
import { Pipe } from '@angular/core';
let PContrastPipe = class PContrastPipe {
    constructor() {
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    transform(input) {
        if (input === null)
            return null;
        const TEXT_COLOR = this.getContrast(input);
        switch (TEXT_COLOR) {
            case 'black':
                return 'text-black';
            case 'white':
                return 'text-white';
        }
    }
    // cSpell:ignore Ferdinandi, Suda
    /* !
     * Get the contrasting color for any hex color
     * (c) 2019 Chris Ferdinandi, MIT License, https://gomakethings.com
     * Derived from work by Brian Suda, https://24ways.org/2010/calculating-color-contrast/
     * @param  {String} A hexcolor value
     * @return {String} The contrasting color (black or white)
     */
    // eslint-disable-next-line jsdoc/require-jsdoc
    getContrast(hexcolor) {
        if (!hexcolor)
            return 'black';
        // If a leading # is provided, remove it
        if (hexcolor.startsWith('#')) {
            hexcolor = hexcolor.slice(1);
        }
        // If a three-character hex-code, make six-character
        if (hexcolor.length === 3) {
            hexcolor = hexcolor.split('').map((hex) => {
                return hex + hex;
            }).join('');
        }
        // Convert to RGB value
        const r = Number.parseInt(hexcolor.slice(0, 2), 16);
        const g = Number.parseInt(hexcolor.slice(2, 4), 16);
        const b = Number.parseInt(hexcolor.slice(4, 6), 16);
        // Get YIQ ratio
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        // Check contrast
        return (yiq < 128) ? 'white' : 'black';
    }
};
PContrastPipe = __decorate([
    Pipe({ name: 'contrastTextColor' }),
    __metadata("design:paramtypes", [])
], PContrastPipe);
export { PContrastPipe };
//# sourceMappingURL=contrast.service.js.map