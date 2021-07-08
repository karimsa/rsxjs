/**
 * @file src/semaphore/index.ts
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */

import { v4 as uuid } from 'uuid'

import { State } from '../store'
import { Mutex } from '../mutex/mutex'
import * as Errors from '../errors'
import { SemaphoreOptions } from './types'
import { Lock, defer, ReleaseLock } from '../types'

interface SemaphoreState {
	tokensOut: number
}

export class Semaphore extends Lock {
	public readonly size: number
	private readonly mutex: Mutex
	private readonly state: State<SemaphoreState>

	constructor(options: SemaphoreOptions) {
		super()
		const namespace = `rsxjs:semaphore(${options.name || uuid()})`

		this.size = options.size
		this.mutex = new Mutex({
			name: `${namespace}:mux`,
			store: options.store,
		})
		this.state = new State<SemaphoreState>({
			namespace: namespace,
			store: options.store,
			defaults: {
				tokensOut: 0,
			},
		})
	}

	/**
	 * Tries to obtain a token from the semaphore.
	 * @param {boolean = true} failWithoutLock if true, it will throw an error if it cannot obtain a token
	 * @returns {Promise<ReleaseLock>} resolves with a function that can be used to release the token
	 */
	async lock(failWithoutLock: boolean = false): Promise<ReleaseLock> {
		const unlock = async () => {
			// try to pass semaphore to next process in queue
			const req = this.requests.shift()
			if (req) {
				req.resolve(unlock)
				return
			}

			// otherwise atomically release
			await this.state.decr('tokensOut')
		}

		// if available, decr and lock
		const releaseMux = await this.mutex.lock()
		if ((await this.state.get('tokensOut')) < this.size) {
			await this.state.incr('tokensOut')
			releaseMux()
			return unlock
		}
		releaseMux()

		if (failWithoutLock) {
			throw new Error(Errors.COULD_NOT_LOCK)
		}

		// if unavailable, push into queue
		const d = defer<ReleaseLock>()
		this.requests.push({
			...d,
			unlock,
		})
		return d.promise
	}
}
