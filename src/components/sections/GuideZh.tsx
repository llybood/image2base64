import { Section } from "./Section";

/**
 * Chinese long-form content — the mirror of GuideEn, written rather than
 * machine-translated, so the two pages read as native copy in each
 * language instead of one echoing the other.
 */
export function GuideZh() {
  return (
    <>
      <Section id="convert">
        <h2>图片 Base64 转换：三种输入方式</h2>
        <p className="section__lede">
          三种进入方式，一套编码逻辑 —— 无论从哪条路径进来，看到的数据口径都一致。
        </p>

        <div className="prose">
          <p>
            这个工具做的事情始终是同一步：读出图片的字节，再把它重新表达为 ASCII 文本。无论字节来自文件选择器、拖拽、剪贴板还是远程地址，跑的都是同一条编码路径。也正因如此，结果区上方的体积数据在任何入口下都可以直接横向比较，不会出现「一个是实测、一个是估算」的情况。
          </p>
        </div>

        <div className="cards3" style={{ marginTop: 28 }}>
          <div className="mini">
            <span className="mini__k">方式一</span>
            <h3>选择本地文件</h3>
            <p>
              标准的文件选择框，已限定为图片类型。一次选中多个文件会作为一批处理，每张都在结果列表中单独保留一条记录。
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">方式二</span>
            <h3>拖拽或粘贴</h3>
            <p>
              把图片拖到页面任意位置即可，也可以按 Ctrl+V（macOS 为 Cmd+V）直接粘贴剪贴板内容 ——
              对没有存盘的截图尤其方便。
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">方式三</span>
            <h3>从地址加载</h3>
            <p>
              粘贴图片链接即可完成图片 URL 转 Base64。这条路径同样能拿到真实字节数，跨域被拦截时的表现见下一节。
            </p>
          </div>
        </div>
      </Section>

      <Section id="url" alt>
        <h2>图片 URL 转 Base64</h2>
        <p className="section__lede">
          从其他站点取图是唯一可能因你无法控制的原因失败的一步，所以它失败得很明确，并且会解释原因。
        </p>

        <div className="prose">
          <p>
            工具会按顺序尝试两种策略。第一种是直接 <code>fetch</code>
            ，优先使用它的原因是能拿到精确的字节长度 —— 你看到的原始大小与体积增幅是实测值而不是估算值。第二种是先用{" "}
            <code>&lt;img&gt;</code> 载入图片再绘制到 canvas 上，它在目标站点允许跨域读取、但直接 fetch
            被拦截时仍然可用。
          </p>
          <p>
            如果目标站点禁止跨域访问，浏览器就会拒绝交出像素数据，两种策略都会失败。这是浏览器的安全策略，不是工具的缺陷，任何前端代码都无法绕过。遇到这种情况时，页面会给出具体原因和可执行的下一步：先把图片下载到本地，再改用本地上传——那条路径根本不跨越任何源。
          </p>
        </div>

        <div className="note">
          <p>
            <b>为什么降级路径会重新编码为 PNG。</b>
            canvas 只能导出它当前持有的像素，无法还原原始容器。走这条路加载的图片会以 PNG
            形式返回，因此其 Base64 体积是近似值，格式也会显示为 PNG，哪怕源文件是 JPEG。直接 fetch
            的路径没有这一限制。
          </p>
        </div>

        <div className="prose prose--wide">
          <table className="spec">
            <caption>一个图片 URL 会经历什么</caption>
            <thead>
              <tr>
                <th scope="col">步骤</th>
                <th scope="col">工具做了什么</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">规范化</th>
                <td>
                  去掉首尾空白；只输入域名时自动补上 <code>https://</code>，因此{" "}
                  <code>example.com/pic.png</code> 与 <code>https://example.com/pic.png</code>{" "}
                  都能使用。
                </td>
              </tr>
              <tr>
                <th scope="row">取回</th>
                <td>
                  以不携带凭证的方式请求字节。返回的 content-type 不是图片时，在编码之前就会被拒绝。
                </td>
              </tr>
              <tr>
                <th scope="row">校验</th>
                <td>
                  格式由文件头的魔数字节实测识别，而不是相信响应头，因此 Data URI 的 MIME 前缀永远不会与它后面承载的载荷不一致。
                </td>
              </tr>
              <tr>
                <th scope="row">编码</th>
                <td>
                  字节按固定分块转换为 Base64，避免超大图片一次性展开导致调用栈溢出。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="online">
        <h2>图片转 Base64 在线完成，图片不出本机</h2>
        <p className="section__lede">
          这里的「在线」指的是免安装、免注册，而不是说你的文件要先去别人的磁盘上转一圈。
        </p>

        <div className="prose">
          <p>
            网上大多数转换工具会把图片上传到服务器、在服务器上编码、再把文本传回来。这个工具不是这样：文件由浏览器自身的
            FileReader API 读取，编码在页面内存中完成，字节从未离开这台机器。这不只是一个说法，你可以自己验证——转换时打开浏览器的网络面板，看不到任何携带图片的请求。
          </p>
          <p>
            由此带来两个实际好处：一是不方便交给第三方的素材（内部截图、客户资料、带元数据的图片）在这里可以放心处理；二是没有上传大小限制与转换队列，也就不存在由服务器施加的容量上限。
          </p>
        </div>

        <div className="cards2" style={{ marginTop: 28 }}>
          <div className="mini">
            <span className="mini__k">设计如此</span>
            <h3>不上传、不排队、无次数限制</h3>
            <p>
              转换速度只取决于你自己的磁盘与 CPU；没有服务端在计数，因此也就没有每日次数限制。
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">可自行验证</span>
            <h3>打开开发者工具看一眼</h3>
            <p>
              按 F12 切到 Network 面板，然后转换一张图片：除了页面本身，没有任何额外请求。
            </p>
          </div>
        </div>
      </Section>

      <Section id="encode" alt>
        <h2>Base64 编码到底对文件做了什么</h2>
        <p className="section__lede">
          Base64 存在的意义，是让二进制数据能够通过只接受文本的通道传输。代价是一份可预期的体积膨胀。
        </p>

        <div className="prose">
          <p>
            编码过程取 3 字节二进制数据（24 位），切成 4 组各 6 位，每组映射到 64
            个可打印 ASCII 字符中的一个。于是每 3 字节变成 4 个字符：固定 4/3 的比例，也就是约 33%
            的增幅。当输入长度不是 3 的整数倍时，末尾会用一到两个 <code>=</code> 补齐，使总长度为 4 的倍数。
          </p>
        </div>

        <div className="prose prose--wide" style={{ marginTop: 24 }}>
          <table className="spec">
            <caption>结果面板中能看到的具体影响</caption>
            <thead>
              <tr>
                <th scope="col">影响</th>
                <th scope="col">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">载荷增幅</th>
                <td>
                  来自 4/3 的字符映射，约 +33%。一张 248 KB 的 PNG 会变成约 331 KB 的文本。
                </td>
              </tr>
              <tr>
                <th scope="row">Data URI 前缀</th>
                <td>
                  当你复制的是带前缀的形式而非纯字符串时，<code>data:image/png;base64,</code>{" "}
                  这一头部会固定多出 22 个字符。
                </td>
              </tr>
              <tr>
                <th scope="row">传输开销</th>
                <td>
                  文本的可压缩性很好，经过 gzip 或 brotli 之后，内联图片的实际传输代价往往远低于裸 Base64 给人的印象。
                </td>
              </tr>
              <tr>
                <th scope="row">缓存</th>
                <td>
                  这才是真正的取舍所在。内联图片无法独立于承载它的文档被缓存，因此文档每次被重新请求，它都会被重新传一遍。
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="prose" style={{ marginTop: 32 }}>
          <h3>什么时候适合用 Data URI</h3>
          <ul>
            <li>
              <b>小图标与 Logo</b>，它们本来每个都要单独承担一次往返请求。
            </li>
            <li>
              <b>需要自包含的场景</b> —— 邮件模板、单文件小工具，或作为单一资源发布的组件库。
            </li>
            <li>
              <b>运行时生成的图片</b> —— canvas 导出后必须以字符串而非文件形式传递的内容。
            </li>
          </ul>

          <h3>什么时候不适合</h3>
          <ul>
            <li>
              <b>照片和较大的图</b>。33% 的额外体积会与「失去独立缓存」「无法渐进解码」叠加在一起。
            </li>
            <li>
              <b>单个资源超过大约 10 KB 之后</b>。超过这个量级，独立请求几乎总是更划算。
            </li>
            <li>
              <b>改动与页面无关的内容</b>，因为任何一处变化都会让整个文档失效重传。
            </li>
          </ul>
        </div>
      </Section>

      <Section id="formats-and-limits">
        <h2>支持的格式与使用边界</h2>

        <div className="prose prose--wide">
          <table className="spec">
            <caption>可接受的输入</caption>
            <thead>
              <tr>
                <th scope="col">格式</th>
                <th scope="col">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">JPG / JPEG</th>
                <td>
                  通过 <code>FF D8</code> 标记识别，照片的常规选择。
                </td>
              </tr>
              <tr>
                <th scope="row">PNG</th>
                <td>无损、支持透明通道，也是 canvas 降级路径导出的格式。</td>
              </tr>
              <tr>
                <th scope="row">GIF</th>
                <td>按原始字节编码；页内预览只显示第一帧。</td>
              </tr>
              <tr>
                <th scope="row">WebP</th>
                <td>
                  通过 <code>RIFF&hellip;WEBP</code> 文件头识别。
                </td>
              </tr>
              <tr>
                <th scope="row">SVG</th>
                <td>
                  按文本读取，编码结果与原始代码逐字节一致，不经过二进制往返，因而不会被破坏。
                </td>
              </tr>
              <tr>
                <th scope="row">BMP / ICO</th>
                <td>按原始字节编码并原样预览。</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="prose" style={{ marginTop: 28 }}>
          <h3>边界</h3>
          <ul>
            <li>
              <b>单张上限 10 MB。</b>超出时会显示实际大小并拒绝转换，而不是中途静默失败。
            </li>
            <li>
              <b>每批最多 20 张</b>，结果列表保留最近 30 条。
            </li>
            <li>
              <b>跨域图片需要目标站点授权。</b>若目标站点未返回 CORS
              头，浏览器会阻止读取，此时工具会明确说明，而不是返回一段坏掉的字符串。
            </li>
          </ul>
        </div>
      </Section>
    </>
  );
}
