import { A_BUTTON, B_BUTTON, DOWN_ARROW, LEFT_ARROW, NUMERICS, RETURN_HANDLER, RETURN_KEY, RIGHT_ARROW, SELECT_HANDLER, SELECT_KEY, UP_ARROW } from "../js/constants.js";
import { DLX } from "../js/DLX.js";
import { KeyEmitter } from "../js/KeyEmitter.js";
import { DokuCell } from "./DokuCell.js";

/**
 * The template for the puzzle. 
 * 
 * The rows are not populated because the DokuCell instances dont have the methods I wrote if provided that way. 
 * 
 * This method combines the template method with a dynamic method to make the board more interactive. 
 */
const template = document.createElement('template')
template.innerHTML = `
<div class="overlay"><h1><svg width="1em" height="1em" viewBox="-60 -60 120 120" class="loading-symbol">
	<path d="M -19.1342,-48.2963 A 50 50 15 1 0 19.1342,-48.2963"/>
</svg>  Loading Puzzle</h1></div>
<table>
</table>
<aside>
	<ul>
		<li><b>Difficulty:</b><span class="difficulty"></span></li>
		<li><i class="fa-solid fa-rotate-right control-btn grey"></i><p>to change puzzle</p></li>
		<li><i class="fa-solid fa-a control-btn red"></i><p>Fill in singles</p></li>
		<li><i class="fa-solid fa-b control-btn green"></i><p>Move to fewest possible</p></li>
	</ul>
</aside>
`;

export class DokuBoard extends HTMLElement {
	_position = [0, 0]
	//the api being used to source the puzzles doesnt seem to work right there has been an open issue since january but for now this will have to do.
	_difficulty = undefined;
	_puzzle = undefined;
	constructor(){
		super();
		this.appendChild(template.content.cloneNode(true));
		this.build();
		this.dlx = new DLX();
		this.loadPuzzle()
	}

	get puzzle(){ return this._puzzle; }
	set puzzle(v){
		this._puzzle = v;
		const {values, locked, difficulty} = v;
		this.difficulty = difficulty;
		this.dlx = new DLX();
		let hasError = false;
		for(let i = 0; i<81; i++){
			this.cells[i].locked = locked[i];
			this.cells[i].value = values[i];
			if(values[i]) {
				const err = !this.dlx.coverCell(i, values[i]);
				hasError = hasError || err
			}
		}
		this.update();
		this.updateSelection();
	}

	get difficulty(){ return this._difficulty; }
	set difficulty(v){
		if(this._difficulty === v) return; //dont update
		this._difficulty = v;
		this.querySelector('.difficulty').innerHTML = v;
	}

	get position(){ return this._position[0]; }
	set position(v){
		this._position = v;
		this.updateSelection();
	}
	get sx(){ return this._position[0]; }
	set sx(x){ 
		this._position[0] = (9+x)%9;
		this.updateSelection();
	}

	get sy(){ return this._position[1]; }
	set sy(y){ 
		this._position[1] = (9+y)%9;
		this.updateSelection();
	}

	get s(){ return this.selectionIndex(this.sx, this.sy); }

	get values(){ return this._puzzle.values; }
	set values(v){
		this._puzzle.values = v;
		
		this.dlx = new DLX();
		let hasErrors = false;
		for(let i = 0; i < 81; i++){
			this.cells[i].value = v[i];
			if(v[i]) {
				const err = !this.dlx.coverCell(i, v[i]);
				hasErrors = hasErrors || err;
			}
		}
		this.update();
		this.updateSelection();
		this.checkForErrors(hasErrors);
	}
	async loadPuzzle(){
		this._overlay.classList.remove('hide');
		//I have confirmed the solution is not always the only possible solution. therefore solution will be omitted from use and dlx will be responsible for error checking.
		this.puzzle = await fetch('https://sudoku-api.vercel.app/api/dosuku')
		.then(r=>r.json())
		.then(({newboard:{grids:[puzzle]}})=>{
			const values = puzzle.value.flatMap(v=>v);
			return {values, locked:values.map(v=>!!v), rows:new Set(values.map((v,i)=>v>0?i*9+v:0).filter(v=>v>0).map(v=>v-1)), difficulty: puzzle.difficulty}
		});
		this._overlay.classList.add('hide');
	}

	connectedCallback(){
		this.keyListeners = new KeyEmitter();
		this.keyListeners.on(RETURN_KEY, ()=>this.refresh && this.refresh());
		this.keyListeners.on(SELECT_KEY, SELECT_HANDLER);
		this.keyListeners.on(UP_ARROW, ()=>this.sy -= 1);
		this.keyListeners.on(DOWN_ARROW, ()=>this.sy += 1);
		this.keyListeners.on(LEFT_ARROW, ()=>this.sx -= 1);
		this.keyListeners.on(RIGHT_ARROW, ()=>this.sx += 1);
		this.keyListeners.on(A_BUTTON, ()=>this.fillSingles());
		this.keyListeners.on(B_BUTTON, ()=>this.findLeastPossible());
		this.keyListeners.on(NUMERICS, (e)=>{
			const s = this.s;
			const v = e.keyCode - 48;
			
			if(this.cells[s].locked) return;
			this.cells[s].hasError = false;
			const vals = this.values;
			vals[s] = v;
			this.values = vals;
		});
		this.updateSelection();
		
	}

	findLeastPossible(){
		let j = -1;
		let m = -1;
		for(const [i, impossibles] of this.dlx.impossibles()){
			if(this.values[i]) continue;
			if(!~j || impossibles.size > m){
				j = i;
				m = impossibles.size;
			}
		}
		if(~j){
			this.position=[j%9,Math.floor(j/9)];
		}
	}

	fillSingles(){

		const values = this.values;
		let foundSingle = false;
		for(const [i, impossibles] of this.dlx.impossibles()){
			if(values[i]) continue;
			if(impossibles.size === 8){
				foundSingle = true;
				const n = [0,1,2,3,4,5,6,7,8].filter(v=>!impossibles.has(v));
				values[i] = n[0]+1;
			}
		}
		this.values = values;
		if(foundSingle) this.fillSingles();
		else this.findLeastPossible();
	}
	disconnectedCallback(){
		this.keyListeners.destroy();
	}

	update(){
		for(const [i, impossibles] of this.dlx.impossibles()){
			this.cells[i].impossibles = impossibles;
		}
	}

	build(){
		const table = this.querySelector('table');
		this._overlay = this.querySelector('.overlay')
		this.cells = [];
		for(let i = 0; i<9; i++){
			const row = table.insertRow()
			for(let j = 0; j < 9; j++){
				const cell = row.insertCell();
				const dokuCell = new DokuCell();
				cell.appendChild(dokuCell);
				this.cells.push(dokuCell);
			}
		}
	}

	
	

	selectionIndex(x,y){
		return y*9+x;
	}

	updateSelection(){
		const s = this.s;
		const value = this.cells[s].value;
		const {row, column, box} = DokuBoard.getPosition(s);
		this.cells[s].select();
		for(let i = 0; i<81; i++) {
			const pos = DokuBoard.getPosition(i);
			this.cells[i].assertClass('relative', s !== i && (pos.row === row || pos.column === column || pos.box === box));
			this.cells[i].assertClass('same-value',s !== i && value && value === this.cells[i].value)
		}
	}

	async checkForErrors(hasErrors){
		if(this.dlx.size === 81 && !hasErrors) return this.classList.add("completed");
		if(hasErrors) {
			this.cells[this.s].hasError = true;
			return;
		}
		const dlx = new DLX(this.dlx);
		dlx.solveSync();
		this.cells[this.s].hasError = !dlx.isSolved;
	}

	static getPosition(index){
		const column = index%9;
		const row = Math.floor(index/9);
		const box = Math.floor(row/3)*3+Math.floor(column/3);
		return {row, column, box}
	}
}

customElements.define('doku-board', DokuBoard);