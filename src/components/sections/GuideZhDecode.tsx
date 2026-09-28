import { Section } from "./Section";

/**
 * 中文长文板块 —— 反向工具（base64 → 图片）。
 *
 * 结构与 GuideZh 对称：每个 H2 对应一个目标查询，正文才是真正带来排名
 * 的部分。内容与正向页刻意不重复 —— 解码方向有它自己的话题，这正是它
 * 值得拥有独立页面的理由。
 */
export function GuideZhDecode() {
  return (
    <>
      <Section id="convert">
        <h2>base64 转图片：三种粘贴方式</h2>
        <p className="section__lede">
          只有一个输入框，但有三种填法 —— 而且三种都接受同样范围的字符串。
        </p>

        <div className="prose">
          <p>
            你拿到的 base64 字符串，形态取决于生成它的工具：可能是接口返回的纯 Base64，可能是
            样式表里的 <code>data:image/png;base64,…</code> 完整 Data URI，可能是从日志里连
            引号一起复制出来的片段，也可能是 URL-safe 变体。本工具会在读取第一个字节之前先把
            这些形态统一处理掉，所以字符串的格式从来不是需要你手工清理的东西。
          </p>
        </div>

        <div className="cards3" style={{ marginTop: 28 }}>
          <div className="mini">
            <span className="mini__k">方式一</span>
            <h3>从剪贴板读取</h3>
            <p>
              点一下按钮即可读取剪贴板。字符串很长、不想滚动选中时最省事，也适用于那些不给
              选中机会、只提供「复制」的应用。
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">方式二</span>
            <h3>任意位置 Ctrl+V</h3>
            <p>
              页面处于焦点时直接按 Ctrl+V 即可，不必先点进输入框。粘贴是这个工具的核心动作，
              所以它在光标停在哪里都能用。
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">方式三</span>
            <h3>直接输入或拖入</h3>
            <p>
              编辑是实时的：图片随字符串变化即时更新。这意味着你可以把一段被截断的内容逐字
              剪到最后一个合法字符，看它什么时候变回一张完整的图。
            </p>
          </div>
        </div>

        <div className="note" style={{ marginTop: 32 }}>
          <p>
            <b>什么算「合法字符串」。</b>换行与空格会被忽略，所以被折行的长串可以直接粘贴。
            URL-safe 字母表（<code>-</code> 与 <code>_</code>）会被自动转换，缺失的{" "}
            <code>=</code> 补位会被补齐。外层引号、<code>url(…)</code> 包裹与{" "}
            <code>data:</code> 前缀都会被剥离。只有真正不属于 base64 的字符才会残留下来并
            被报告为错误。
          </p>
        </div>
      </Section>

      <Section id="converter" alt>
        <h2>base64 转图片 在线，字符串不上传</h2>
        <p className="section__lede">
          「在线」指的是不用安装、不用注册 —— 不包括让你的字符串绕道别人的服务器。
        </p>

        <div className="prose">
          <p>
            很多在线工具把你的字符串 POST 到后端，在服务器上解码，再把图片传回来。本工具全程
            在页面内存里完成：字符串被解析、解码、变成 blob，期间没有任何一个请求携带它。这
            一点在解码方向上比编码方向更重要 —— base64 字符串往往恰好就是你不想让它上路的
            东西：私有文档里的内联图片、内部接口返回的载荷、别人私下发给你的截图。
          </p>
          <p>
            这不是一句只能靠信任接受的话。打开浏览器开发者工具，切到 Network 面板，然后解码
            一段字符串：除了加载本页本身，你不会看到任何请求。
          </p>
        </div>

        <div className="cards2" style={{ marginTop: 28 }}>
          <div className="mini">
            <span className="mini__k">本地完成</span>
            <h3>不上传、不排队、无配额</h3>
            <p>
              解码速度只取决于你自己的 CPU。没有每日次数限制，因为没有服务器在计数，也没有
              什么需要限流。
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">可自证</span>
            <h3>你可以自己验证</h3>
            <p>
              开发者工具 → Network → 解码一段字符串。你能看到的请求，只有最初加载这个页面
              的那几个。
            </p>
          </div>
        </div>
      </Section>

      <Section id="decode">
        <h2>base64 解码：字符串是怎么变回图片的</h2>
        <p className="section__lede">
          解出来的是一份真正的二进制文件，不是「看起来像文件」的文本。区别就在这里。
        </p>

        <div className="prose">
          <p>
            解码就是编码的严格逆运算：每 4 个字符还原成 3 个字节，补位被丢弃，剩下的就是当初
            被编码的那份文件，逐字节相同。把一张图片用正向工具转成 base64、再用本工具转回去，
            得到的是原始字节 —— 这正是「下载」按钮给出的文件能被操作系统正常识别，而不是一个
            只有后缀对的空壳的原因。
          </p>
          <p>
            文本形态总是比它承载的文件更大。base64 每 3 个字节要花 4 个字符，大约四分之一的
            字符串是额外开销 —— 结果面板上「较文本缩减」显示的就是这个比例，而且是拿你实际
            粘贴的字符串量出来的，不是估算值。
          </p>
        </div>

        <div className="prose prose--wide" style={{ marginTop: 24 }}>
          <table className="spec">
            <caption>结果面板上的数字分别意味着什么</caption>
            <thead>
              <tr>
                <th scope="col">指标</th>
                <th scope="col">怎么得到的</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">解码后大小</th>
                <td>
                  解码缓冲区的真实字节数 —— 也就是保存下来的文件会有多大，而不是从字符串长度
                  推出来的估算值。
                </td>
              </tr>
              <tr>
                <th scope="row">较文本缩减</th>
                <td>
                  解码字节数与规范化后字符串长度的比值。因为你粘贴进来的空白已被剔除，这个
                  比值不会被格式问题扭曲。
                </td>
              </tr>
              <tr>
                <th scope="row">像素尺寸</th>
                <td>
                  从解码出的图片本身读取。当格式合法但不含固有尺寸时显示为短横线 —— 例如没有{" "}
                  <code>width</code> 和 <code>height</code> 的 SVG。
                </td>
              </tr>
              <tr>
                <th scope="row">识别结果</th>
                <td>
                  按字节实测出的格式；当 data: 前缀的声明与实际不符时，两侧都会列出来。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="formatcheck" alt>
        <h2>base64 转图片 工具：该做对什么</h2>
        <p className="section__lede">
          解码本身只是一次函数调用。知道解出来的字节「是什么」，才是区分可用工具与看起来
          可用的工具的地方。
        </p>

        <div className="prose">
          <p>
            纯 base64 字符串不携带任何类型信息。它只是一个 64 进制的数字，里面没有一个字节
            在说「我是 PNG」或「我是 JPEG」。唯一的线索是 <code>data:</code> 前缀，而那是
            生成字符串的一方写下的标签，不是关于字节的事实。标签会被改名后的文件带过来，会
            在格式转换时被复制粘贴，也会被某些导出库硬编码成从来不校验的固定值。
          </p>
          <p>
            所以本工具读字节。它把开头几个字节与所支持格式的已知签名逐一比对，并把前缀当作
            一个待交叉验证的声明，而不是事实来源。两者冲突时会明确告诉你以谁为准 —— 因为
            一个被贴错标签的文件，值得在你用错误后缀保存它之前就知道。
          </p>
        </div>

        <div className="prose prose--wide" style={{ marginTop: 24 }}>
          <table className="spec">
            <caption>依次执行的校验</caption>
            <thead>
              <tr>
                <th scope="col">校验</th>
                <th scope="col">拦住的是什么</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">字符集</th>
                <td>
                  base64 不可能包含的字符 —— 从源码里复制时顺带带出来的引号、行号或 Markdown
                  标记。
                </td>
              </tr>
              <tr>
                <th scope="row">长度上限</th>
                <td>
                  字符数会在解码<em>之前</em>与上限比对，所以超长的粘贴会被直接拒绝，而不是
                  先分配内存再说。
                </td>
              </tr>
              <tr>
                <th scope="row">长度算术</th>
                <td>
                  base64 把 3 字节编成 4 字符，因此长度是 4n + 1 的情况不可能存在。出现这个
                  余数就说明字符串被截断了，工具会据此报告截断，而不是报一个语焉不详的解码
                  失败。
                </td>
              </tr>
              <tr>
                <th scope="row">字节签名</th>
                <td>
                  解码后的字节会与各格式签名比对。全部不匹配时，说明字符串能解码但不是图片，
                  工具会直说，而不是存出一个后缀误导人的文件。
                </td>
              </tr>
              <tr>
                <th scope="row">前缀一致性</th>
                <td>
                  <code>data:</code> 前缀与实测签名冲突时给出警告，并以字节为准。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="formats-and-limits">
        <h2>base64 转 png、jpg、webp 与 svg</h2>
        <p className="section__lede">
          只要字节签名可辨认都能识别 —— 依据是解码后的字节，不是标签。
        </p>

        <div className="prose prose--wide">
          <table className="spec">
            <caption>本解码器识别的格式</caption>
            <thead>
              <tr>
                <th scope="col">格式</th>
                <th scope="col">签名，以及对你意味着什么</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">PNG</th>
                <td>
                  按完整 8 字节签名匹配。无损、支持透明，也是多数截图工具的默认输出格式。
                </td>
              </tr>
              <tr>
                <th scope="row">JPG / JPEG</th>
                <td>
                  按 <code>FF D8 FF</code> 匹配，而不是只匹配 <code>FF D8</code> —— 后者过于
                  常见，作为证据不够。
                </td>
              </tr>
              <tr>
                <th scope="row">GIF</th>
                <td>
                  同时支持 <code>GIF87a</code> 与 <code>GIF89a</code>。预览只显示第一帧，
                  下载得到的是完整动图。
                </td>
              </tr>
              <tr>
                <th scope="row">WebP</th>
                <td>通过 RIFF 容器头匹配。</td>
              </tr>
              <tr>
                <th scope="row">SVG</th>
                <td>
                  它是标记语言而非像素，所以按文本识别，而不是按字节签名。
                </td>
              </tr>
              <tr>
                <th scope="row">BMP / ICO</th>
                <td>
                  按开头字节匹配。ICO 是本工具支持的唯一一个签名以连续零字节开头的格式。
                </td>
              </tr>
              <tr>
                <th scope="row">AVIF</th>
                <td>
                  从 ISO 基础媒体容器中读出 brand 后再判断，而不是假定 —— 同一个容器里也可能
                  是浏览器至今无法渲染的 HEIC。
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="note" style={{ marginTop: 28 }}>
          <p>
            <b>SVG 永远不会被内联进本页面。</b>解码出的 SVG 通过 <code>&lt;img&gt;</code>{" "}
            元素预览，脚本在其中不会执行。把 SVG 标记直接渲染进文档，是让一个解码器变成 XSS
            入口的典型做法，而不少在线转换工具正是这么做的。
          </p>
        </div>

        <div className="prose" style={{ marginTop: 24 }}>
          <h3>边界</h3>
          <ul>
            <li>
              <b>解码后 10 MB。</b>约 1400 万个 base64 字符。上限作用于字符串长度、且在解码
              之前判断，所以超长粘贴会被直接拒绝，而不是把标签页卡死。
            </li>
            <li>
              <b>一次一个字符串。</b>这个工具回答的是单点问题，因此没有批量模式需要斟酌。
            </li>
            <li>
              <b>未知格式会被拒绝。</b>解码结果不具备可识别图片签名的字符串会被如实报告，
              而不是存成一个打不开的 <code>.png</code>。
            </li>
          </ul>
        </div>
      </Section>
    </>
  );
}
