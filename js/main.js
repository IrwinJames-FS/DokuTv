import { KeyEmitter } from "./KeyEmitter.js";
/**
 * A convenience method to toggle a className based on a boolean.
 * @param {*} className 
 * @param {*} ensure 
 */
HTMLElement.prototype.assertClass = function(className, ensure){
    if(ensure) this.classList.add(className);
    else this.classList.remove(className);
}
/**
 * MDN says this function should exists... now it does. 
 * @param {(any)=>boolean} cb 
 * @returns 
 */
Set.prototype.every = function(cb){
    for(const c of this){
        if(!cb(c)) return false;
    }
    return true;
}
//Initialize function
const init = function () {
    //a basic global listener however additional listeners can be created focusing on a specific element or not. 
    
};

// window.onload can work without <body onload="">
window.onload = init;
