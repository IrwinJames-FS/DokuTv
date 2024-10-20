/**
 * I needed a basic event emitter that piggy backs off another event emitter. 
 * 
 * This just makes watching for specific keys easier. 
 */
export class KeyEmitter {
	constructor(el=document){
		this.element = el;
		this.listeners = new Map();
		this.listener = e => {
			this.emit(e.keyCode, e);
		}
		el.addEventListener('keydown', this.listener);
	}

	

	on(key, cb){
		const keys = Array.isArray(key) ? key:[key]
		for(const kk of keys){
			const k = parseInt(kk);
			if(this.listeners.has(k)) this.listeners.get(k).push(cb);
			else this.listeners.set(k, [cb]);
		}
		return this;
	}

	off(key, cb){
		if(!this.listeners.has(key)) return this;
		if(!cb) this.listeners.delete(key);
		const i = this.listeners.get(key).findIndex(c=>c===cb);
		if(!~i) return this;
		this.listeners.get(key).splice(i, 1);
		return this;
	}

	once(key, cb){
		const handler = e => {
			cb(e);
			this.off(key, cb);
		}
		this.on(key, handler);
		return this;
	}

	clear(omits=[]){
		omits = Array.isArray(omits) ? omits:[omits]
		for(const k of this.listeners.keys()){
			if(omits.includes(k)) continue;
			this.listeners.delete(k);
		}
	}

	destroy(){
		this.element.removeEventListener('keydown', this.listener);
	}

	async emit(key, event){
		if(!this.listeners.has(key)) {
			console.log("Unused button", key, event);
			return;
		}
		const cbs = this.listeners.get(key) ?? []
		for(const cb of cbs){
			await cb(event);
		}
	}
}