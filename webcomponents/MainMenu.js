import { ARROWS, DOWN_ARROW, RETURN_HANDLER, RETURN_KEY, SELECT_HANDLER, SELECT_KEY, UP_ARROW } from "../js/constants.js";
import { KeyEmitter } from "../js/KeyEmitter.js";

const template = document.createElement('template');
template.innerHTML = `
<nav>
<button></button>
</nav>
`;

export class MainMenu extends HTMLElement {
	_index = 0;
	actions = [
		["New Game", ()=>{
			console.log("onMenuSelect", this.onMenuSelect)
			this.onMenuSelect && this.onMenuSelect(1)
		}],
	]
	buttons = [];
	constructor(){
		super()
		this.appendChild(template.content.cloneNode(true));
		
		
	}

	connectedCallback(){
		this.keyListener = new KeyEmitter();
		this.keyListener.on(RETURN_KEY, RETURN_HANDLER);
		this.keyListener.on(SELECT_KEY, SELECT_HANDLER);
		this.keyListener.on(ARROWS, ()=>this.buttons[0].focus());
		this.render();
	}

	disconnectedCallback(){
		this.keyListener.destroy();
	}

	get onMenuSelect(){ 
		return this._onMenuSelect }

	set onMenuSelect(v){ this._onMenuSelect = v }

	get index(){ return this._index; }

	set index(v){
		//cyclical iteration
		this._index = (this.buttons.length + v) % this.buttons.length;
		this.render();
	}

	clickHandler(e){
		console.log("Click handler", e);
	}

	render(){
		const nav = this.querySelector('nav');
		this.buttons = nav.querySelectorAll('button');
		for(let i = 0; i<this.buttons.length; i++){
			this.buttons[i].type = "button";
			this.buttons[i].onclick = this.actions[i][1];
			this.buttons[i].innerText = this.actions[i][0];
		}
		this.buttons[this.index].focus();
	}
}

customElements.define('doku-main-menu', MainMenu);