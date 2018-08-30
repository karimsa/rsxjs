import { Lock, defer } from '../types'
import { makeChan, chan } from '../channel'

class Semaphore extends Lock {
  private q: chan<() => void>

  constructor(bufferSize) {
    super()
    this.q = makeChan<() => void>({ bufferSize })
  }

  isLocked(): boolean {
    return true
  }

  async lock(fail: boolean) {
    const p = defer<void>()
    await this.q.put(p.resolve)
    return p.promise
  }
}
