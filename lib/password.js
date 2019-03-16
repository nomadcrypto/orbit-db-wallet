const RNG = require("seededrsa/rng");
//adopted from https://stackoverflow.com/a/50689199/4425082
const specials = '!@#$%^&*()_+{}:"<>?\|[];\',./`~';
const lowercase = 'abcdefghijklmnopqrstuvwxyz';
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numbers = '0123456789';

const all = specials + lowercase + uppercase + numbers;

class Password {
	constructor(seed, length) {
		this.seed = seed;
    length = length || 10
    if(length < 10) {
      length = 10;
    }
		this.length = length;
		this.rng = new RNG(this.seed)
	}

	async pick(exclusions, string, min, max) {
		const self = this;
		return new Promise(async function(resolve, reject) {
			try {
        let n, chars = '';

        if (max === undefined) {
          n = min;
        } else {
          n = self.rng.randomRange(min, max);
        }

        var i = 0;
        while (i < n) {
          const character = string.charAt(self.rng.randomRange(0, string.length));
          if (exclusions.indexOf(character) < 0 && chars.indexOf(character) < 0) {
            chars += character;
            i++;
          }
        }

        resolve(chars);
			} catch(e) {
				reject(e)
			}
		})
	}

  async shuffle(string) {
    const self = this;
    return new Promise(async function(resolve, reject) {
      try {
        let array = string.split('');
        let tmp, current, top = array.length;

        if (top) while (--top) {
          current = Math.floor(self.rng.random() * (top + 1));
          tmp = array[current];
          array[current] = array[top];
          array[top] = tmp;
        }

        resolve(array.join(''));

      } catch(e) {
        reject(e)
      }
    })
  }

  async generate() {
    const self = this;
    return new Promise(async function(resolve, reject) {
      try {
        let password = '';
        password += await self.pick(password, specials, 1, 3)
        password += await self.pick(password, lowercase, 1, 3)
        password += await self.pick(password, uppercase, 1,3)
        password += await self.pick(password, all, self.length);
        password = await self.shuffle(password)
        resolve(password)
      } catch(e) {
        reject(e)
      }
    })
  }
}


module.exports = async function(seed, length) {
  return new Promise(async function(resolve, reject) {
    try {
      let pass = new Password(seed, length);
      let password = await pass.generate()
      resolve(password)

    } catch (e) {
      reject(e)
    }
  })
};