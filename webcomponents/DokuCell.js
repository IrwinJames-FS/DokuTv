const template = document.createElement('template');
template.innerHTML = `
<input type="text" pattern="\d"/>
<div>
	<span>1</span>
	<span>2</span>
	<span>3</span>
	<span>4</span>
	<span>5</span>
	<span>6</span>
	<span>7</span>
	<span>8</span>
	<span>9</span>
</div>
`;
export class DokuCell extends HTMLElement {
	_value="";
	_impossibles=new Set();
	_locked=false;
	_hasError=false;
	constructor(){
		super();
		this.appendChild(template.content.cloneNode(true));
		this.input = this.querySelector('input');
		this.helpers = this.querySelectorAll('span');
	}

	connectedCallback(){
		this.input.value = this.value;
	}

	get value(){ return this._value; }
	set value(v){
		const val = v || "";
		this._value = val;
		this.input.value = val;
	}

	get impossibles() { return this._impossibles; }
	set impossibles(v) { 
		this._impossibles = v || new Set();
		for(let i = 0; i < 9; i++){
			if(this._impossibles.has(i)) this.helpers[i].classList.add('hidden');
			else this.helpers[i].classList.remove('hidden');

		}
	}

	get hasError(){ return this._hasError; }
	set hasError(v) {
		this._hasError = v;
		this.assertClass('has-error', v);
	}
	get locked(){ return this._locked }
	set locked(v){
		this._locked = v;
		this.assertClass('locked', v);
	}

	select(){
		this.input.focus();
	}

}

customElements.define('doku-cell', DokuCell);