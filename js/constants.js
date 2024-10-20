/**
 * The Return button
 */
export const RETURN_KEY = 10009;

/**
 * The recommended behavior provided by tizen however this will kill the application. I use this button as a refresh instead.
 * @returns 
 */
export const RETURN_HANDLER = () => tizen.application.getCurrentApplication().exit();

/**
 * The center button. should be the same as the 'return' button on a keyboard
 */
export const SELECT_KEY = 13;
export const SELECT_HANDLER = () => {
	console.log(document.activeElement);
	document.activeElement?.click();
}

/**
 * The arrow keys also align to the arrow keys of a keyboard
 */
export const UP_ARROW = 38;
export const DOWN_ARROW = 40;
export const LEFT_ARROW = 37;
export const RIGHT_ARROW = 39;
export const ARROWS = [UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW];

/*
 * The four buttons at the bottom of the standard samsung model.  
 */
export const A_BUTTON = 403;
export const B_BUTTON = 404;
export const C_BUTTON = 405;
export const D_BUTTON = 406;

/**
 * Numeric keys do not align to keyboard numbers. 
 */
export const NUMERICS = [48,49,50,51,52,53,54,55,56,57];