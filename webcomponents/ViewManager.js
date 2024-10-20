import { DokuBoard } from "./DokuBoard.js";
/**
 * The unecessary view manager
 * 
 * Initially I wanted to support difficulty selection however the api I found has a bug. and there is no way to ensure I receive a valid puzzle of the desired difficulty. You can however attempt to refresh the puzzle 
 */
class ViewManager extends HTMLElement {
	
	constructor(){
		super();
		this.render();
	}

	render(){
		this.innerHTML = '';
		const board = new DokuBoard();
		this.appendChild(board);
		board.refresh = ()=>this.render();
	}
}

customElements.define('view-mgr', ViewManager);