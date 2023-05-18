/*
    This script is called in every page of the website.
    Use it to define functions that are used in multiple pages.
*/

// This is used a lot, so let's just define it here
function format_price(p) {
    // Round the price to the nearest integer or at least 3 significant figures
    if (p < 1000) {
        p = Math.round(p);
    } else {
        p = Math.round(p / 100) * 100;
    }
    return(p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
}

// Call this function to close all modals
function close_all_modals() {
    let modals = document.getElementsByClassName("modal");
    for (let i = 0; i < modals.length; i++) {
        modals[i].style.display = "none";
    }
    unblur_background();
}

// Call blur_background() when any modals are opened
function blur_background() {
    let to_blur = document.getElementsByClassName("gets-blurred");
    for (let i = 0; i < to_blur.length; i++) {
        to_blur[i].style = `
            -webkit-filter: blur(5px);
            -moz-filter: blur(5px);
            -o-filter: blur(5x);
            -ms-filter: blur(5px);
            filter: blur(5px);
        `;
    }
}

// Call unblur_background() when any modals are closed
function unblur_background() {
    let to_unblur = document.getElementsByClassName("gets-blurred");
    for (let i = 0; i < to_unblur.length; i++) {
        to_unblur[i].style = `
            -webkit-filter: blur(0px);
            -moz-filter: blur(0px);
            -o-filter: blur(0px);
            -ms-filter: blur(0px);
            filter: blur(0px);
        `;
    }
}
