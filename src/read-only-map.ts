export default class ReadOnlyMap<K, V> {
  constructor(private map: Map<K, V>) {}

  get(key: K): V | undefined { return this.map.get(key); }

  *[Symbol.iterator]() {
    for (let value of this.map) { yield value; }
  };
}