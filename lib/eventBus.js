'use strict';

exports = module.exports = class {
	constructor() {
		this.events = {};
		this.eventsOnce = {};
	}

	off(event){
		delete this.events[event];
		delete this.eventsOnce[event];
	}

	on(event, callback){
		event = this.events[event] = this.events[event] || [];
		event.push(callback);
	}

	once(event, callback){
		this.off(event);
		this.eventsOnce[event] = true;
		event = this.events[event] = [ callback ];
	}

	async emit(event) {
		const list = this.events[event];
		const once = !!this.eventsOnce[event];
		if(!list || !list[0]) return true;
		const args = list.slice.call(arguments, 1);
		for(let i=0;i<list.length;i++){
			if(typeof list[i] !== 'function') continue;
			await list[i].apply(this, args);
		}
		if(once) this.off(event);
		return true;
	}

}