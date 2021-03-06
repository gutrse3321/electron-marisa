import db from 'datastore'
import Segment from 'segment'
const segment = new Segment()
segment.useDefault()

export default class MarisaCore {
  /**
   * 魔理沙与你的说话格式,以及处理You的说话格式
   * @param {String} name
   * @param {String} content
   */
  static speak (name, content) {
    let obj = {
      name: name,
      content: content
    }
    return obj
  }

  /**
   * 魔理沙的回复逻辑判断中枢
   * @param {String} content
   */
  static reply (content) {
    let memorise = db.get('memorise').value()
    let _pplContent = segment.doSegment(content, {simple: true})
    let answer = ''
    let keywords = []

    // 处理获取的_content到数据库去遍历查询
    // 大于60%就回复对应回答
    for (let i = 0; i < memorise.length; i++) {
      let ratio = 0
      keywords = memorise[i].keyword
      for (let j = 0; j < keywords.length; j++) {
        _pplContent.forEach(ppl => {
          if (keywords[j] === ppl) {
            ratio++
          }
        })
        if ((ratio / keywords.length) >= 0.6) {
          answer = memorise[i].answer
          break
        }
      }
    }
    return answer
  }

  /**
   * 魔理沙学习中枢
   * @param {String} content
   */
  static teach (content) {
    // 将you`marisa格式转换为[you,marisa]数组
    let str = content.split('`')
    // 将you的句子分词分一个数组
    let toPpl = segment.doSegment(str[0], {simple: true})
    // 获取数据库所有的记忆
    let memorise = db.get('memorise').value()
    // 遍历数据库查询匹配的回答
    let keywords = []
    let memorey = {}
    for (let i = 0; i < memorise.length; i++) {
      let ratio = 0
      keywords = memorise[i].keyword
      for (let j = 0; j < keywords.length; j++) {
        toPpl.forEach(ppl => {
          if (keywords[j] === ppl) {
            ratio++
          }
        })
        if ((ratio / keywords.length) >= 0.6) {
          keywords.concat(toPpl)
          // 去除重复的关键词或字
          keywords = Array.from(new Set(keywords.filter((x, i, self) => self.indexOf(x) === i)))
          memorey = {
            keyword: keywords,
            answer: str[1]
          }
          break
        } else {
          memorey = {
            keyword: toPpl,
            answer: str[1]
          }
          break
        }
      }
    }
    // 初始安装魔理沙
    if (memorise.length <= 0) {
      memorey = {
        keyword: toPpl,
        answer: str[1]
      }
    }
    return memorey
  }

  /**
   * 魔理沙记忆消除中枢
   * @param {Array} list
   */
  static forget (list) {
    let answers = []
    list.forEach((item) => {
      if (item.name === '白絲魔理沙') {
        answers.push(item)
      }
    })
    if (answers.length > 1) {
      let finder = db.get('memorise').find({answer: answers[answers.length - 1].content}).value()
      if (finder !== undefined) {
        db.get('memorise').remove({answer: finder.answer}).write()
        return true
      } else {
        return false
      }
    }
  }
}
