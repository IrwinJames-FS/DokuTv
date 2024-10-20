function* range(start, distance){
	for(let i = 0; i<distance; i++){
		yield i+start
	}
}

/**
 * A dirty DLX representation. 
 * 
 * A true DLX algorithm would be a bidirectional node list of header object which contain quad directional nodes each with a specialized property point back to its "column header". the Adding and removing of elements utilizing the coupling and decoupling of these links allows for chunks of the cover grid to be removed at once.
 * 
 * This method while still efficient simulates the behavior to achieve the same endgoal but uses Sets and Arrays to do so.
 */
export class DLX extends Set {
	isSolved = false;
	/** @type {Array<Set<number> | null>} */
	columns = new Array(324);
	/**
	 * 
	 * @param {number[]} [rows]
	 */
	constructor(rows=[]){
		super(rows);
		this.init();
		this.coverAll(rows)
	}

	/**
	 * This will need to be reused periodically
	 */
	init(){
		const [rows, columns, columnKeys] = DLX.blank();
		this.rows = rows;
		this.columns = columns;
		this.columnKeys = columnKeys;
		this.cache = new Array(729);
	}

	/**
	 * The same cover method used when solving however fails if the root columns do not exist indicating a conflicting value has already been used on the board.
	 * @param {*} row 
	 * @returns 
	 */
	strictCover(row){
		let cache = new Set();
		this.add(row);
		for(const [c] of this.rows[row].entries()){
			if(!this.columnKeys.has(c)) throw new Error("This column has already been covered");
			this.columnKeys.delete(c);
			const col = this.columns[c];
			if(!col) continue;
			cache = new Set([...cache, ...col]);
			this.columns[c] = null;
		}
		for(const [r] of cache.entries()){
			for(const [c] of this.rows[r].entries()){
				this.columns[c]?.delete(r);
			}
		}
		return cache;
	}

	/**
	 * Removes all conflicting values from the board.
	 * @param {*} row 
	 * @returns 
	 */
	cover(row){
		let cache = new Set();
		this.add(row);
		for(const [c] of this.rows[row].entries()){
			this.columnKeys.delete(c);
			const col = this.columns[c];
			if(!col) continue;
			cache = new Set([...cache, ...col]);
			this.columns[c] = null;
		}
		for(const [r] of cache.entries()){
			for(const [c] of this.rows[r].entries()){
				this.columns[c]?.delete(r);
			}
		}
		return cache;
	}

	/**
	 * Adds values back to the board.
	 * 
	 * (This method must be called in the revers order as the cover methods otherwise the algorithm  will break.)
	 * @param {*} row 
	 * @param {*} cache 
	 */
	uncover(row, cache){
		if(!this.isSolved) this.delete(row);
		for(const [r] of cache.entries()){
			for(const [c] of this.rows[r].entries()){
				if(this.columns[c]) this.columns[c].add(r);
				else {
					this.columns[c] = new Set([r]);
					this.columnKeys.add(c);
				}
			}
		}
	}

	/**
	 * Picks the column (or rule) with the least number of viable values associated to it.
	 * @returns 
	 */
	pickColumn(){
		if(!this.columnKeys.size) return -1;
		let i = -1;
		let size = -1;
		for(const k of this.columnKeys){
			const csize = this.columns[k].size;
			if(!~i || csize < size){
				i = k;
				size = csize;
				if(csize === 0) return i;
			}
		}
		return i;
	}

	/**
	 * The same as a the solve logic but without the await. When starting from a blank board this has a problem with stack size. 
	 * 
	 * This is just a test to see if its feesable.
	 */
	solveSync(){
		this.isSolved = false;
		const ci = this.pickColumn();
		if(!~ci){
			this.isSolved = true;
			return this;
		}
		for(const r of this.columns[ci]){
			const cache = this.cover(r);
			this.solve();
			this.uncover(r,cache);
			if(this.isSolved) return this;
		}
		return this;
	}

	/**
	 * Solving is an np complete problem when working with blank boards this should be used instead to avoid stack size overload. 
	 * @returns 
	 */
	async solve(){
		this.isSolved = false;
		const ci = this.pickColumn();
		if(!~ci) {
			this.isSolved = true;
			return this;
		}
		for(const r of this.columns[ci]){
			const cache = this.cover(r);
			await this.solve()
			this.uncover(r, cache);
			if(this.isSolved) return this;
		}
		return this;
	}

	/**
	 * Covers all the rows provided in an array or set
	 * @param {*} rws 
	 * @returns 
	 */
	coverAll(rws){
		let cache = new Set();
		for(const r of rws){
			cache = new Set([...cache, ...this.cover(r)]);
		}
		return cache;
	}

	/**
	 * Not part of the dlx requirements but converts the value and sudoku index to a dlx row index and covers the row. 
	 * @param {*} i 
	 * @param {*} v 
	 * @returns 
	 */
	coverCell(i, v){
		try{
			this.strictCover(i*9+v-1);
			return true;
		} catch (e){
			console.log(e.message);
			return false;
		}
		
	}

	/**
	 * Similar to the previous method however this does not assume a non blank value is being added this effectively reconstructs the table accounting for change or removed values. 
	 * @param {*} i 
	 * @param {*} v 
	 * @returns 
	 */
	setValue(i, v){
		for(const k of range(i*9,9)) this.delete(k);
		this.init();
		this.coverAll(this);
		const row = i*9+v-1;
		this.cover(row);
		return this;
	}

	/**
	 * Removes any values that can be associated with the sudoku index.
	 * @param {*} i 
	 * @returns 
	 */
	removeValueAtIndex(i){
		for(const k of range(i*9, 9)){
			this.delete(k);
		}
		this.init();
		this.coverAll(this);
		return this;
	}

	/**
	 * An iterator convenience to update the helper items.
	 * 
	 * When a value is changed determining a visual representation of what possible values its relatives can have can be tricky this works by gathering all remaining dlx rows and converting them to the sudoku index and value.
	 * 
	 * to avoid this calculation being performed excessively this iterates over every sudoku index and provides the values that cannot be used. 
	 */
	*impossibles(){
		let rs = this.columns.reduce((o,v)=>{
			return new Set([...o, ...(v ?? [])])
		}, new Set());
		for(let i = 0; i<81; i++){
			let impossibles = new Set();
			for(const c of range(i*9, 9)){
				if(!rs.has(c)) impossibles.add(c%9)
			}
			yield [i, impossibles];
		}
	}

	/**
	 * Recalculate the DLX grid objects. 
	 * @returns 
	 */
	static blank(){
		const rows = new Array(729).fill(0);
		/** @type {Array<Set<number>>} */
		const columns = new Array(324).fill(0);
		const keys = new Set(columns.keys());
		for(let r = 0; r<729; r++){
			const v = r%9;
			const i = Math.floor(r/9);
			const x = i%9;
			const y = Math.floor(i/9);
			const b = Math.floor(y/3)*3 + Math.floor(x/3);
			const cols = new Set([
				i,
				x*9+v+81,
				y*9+v+162,
				b*9+v+243
			]);
			rows[r] = cols;
			for(const c of cols){
				if(columns[c]) columns[c].add(r);
				else columns[c] = new Set([r]);
			}
		}
		return [rows, columns, keys];
	}

}