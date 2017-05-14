
var scroll_flag = true;
var scroll_direction = 1;         // 1为上，2为下

function scrollInVelocity(velocity) {
    var currentPosition;
    while(scroll_flag) {
        currentPosition = document.documentElement.scrollTop;
        if(scroll_direction === 1) {
            window.scrollTo(0, currentPosition + velocity);
        }
        if(scroll_direction === 2) {
            window.scrollTo(0, currentPosition - velocity);
        }
    }
}

