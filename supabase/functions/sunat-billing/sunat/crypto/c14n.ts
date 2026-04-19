// W3C Canonical XML 1.0 (C14N) implementation for Deno Edge Runtime
// Reference: https://www.w3.org/TR/2001/REC-xml-c14n-20010315

interface XmlElement {
  type: "element";
  prefix: string;
  localName: string;
  attributes: XmlAttr[];
  namespaces: XmlNs[];
  children: XmlNode[];
}

interface XmlAttr {
  prefix: string;
  localName: string;
  value: string;
}

interface XmlNs {
  prefix: string;
  uri: string;
}

interface XmlText {
  type: "text";
  value: string;
}

type XmlNode = XmlElement | XmlText;

function resolveXmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

function parseXml(xml: string): XmlElement {
  let pos = 0;

  function atEnd(): boolean {
    return pos >= xml.length;
  }

  function startsWith(s: string): boolean {
    return xml.substring(pos, pos + s.length) === s;
  }

  function skipWs(): void {
    while (!atEnd() && (xml[pos] === " " || xml[pos] === "\t" || xml[pos] === "\n" || xml[pos] === "\r")) {
      pos++;
    }
  }

  function parseAttrValue(): string {
    const quote = xml[pos];
    pos++;
    let raw = "";
    while (!atEnd() && xml[pos] !== quote) {
      raw += xml[pos];
      pos++;
    }
    if (!atEnd()) pos++;
    return resolveXmlEntities(raw);
  }

  function parseTextContent(): XmlText {
    let raw = "";
    while (!atEnd() && xml[pos] !== "<") {
      raw += xml[pos];
      pos++;
    }
    let resolved = resolveXmlEntities(raw);
    resolved = resolved.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    return { type: "text", value: resolved };
  }

  function parseElement(): XmlElement {
    pos++;

    let tagName = "";
    while (!atEnd() && /[\w.\-:]/.test(xml[pos])) {
      tagName += xml[pos];
      pos++;
    }
    const colon = tagName.indexOf(":");
    const prefix = colon === -1 ? "" : tagName.substring(0, colon);
    const localName = colon === -1 ? tagName : tagName.substring(colon + 1);

    const attributes: XmlAttr[] = [];
    const namespaces: XmlNs[] = [];
    const children: XmlNode[] = [];

    skipWs();

    while (!atEnd() && xml[pos] !== ">" && !startsWith("/>")) {
      let attrName = "";
      while (!atEnd() && xml[pos] !== "=" && xml[pos] !== ">" && xml[pos] !== " " && xml[pos] !== "\t" && xml[pos] !== "\n" && xml[pos] !== "\r") {
        attrName += xml[pos];
        pos++;
      }
      skipWs();
      if (atEnd() || xml[pos] !== "=") break;
      pos++;
      skipWs();

      const attrValue = parseAttrValue();
      skipWs();

      if (attrName === "xmlns") {
        namespaces.push({ prefix: "", uri: attrValue });
      } else if (attrName.startsWith("xmlns:")) {
        namespaces.push({ prefix: attrName.substring(6), uri: attrValue });
      } else {
        const c = attrName.indexOf(":");
        if (c === -1) {
          attributes.push({ prefix: "", localName: attrName, value: attrValue });
        } else {
          attributes.push({
            prefix: attrName.substring(0, c),
            localName: attrName.substring(c + 1),
            value: attrValue,
          });
        }
      }
    }

    let selfClosing = false;
    if (startsWith("/>")) {
      selfClosing = true;
      pos += 2;
    } else if (!atEnd() && xml[pos] === ">") {
      pos++;
    }

    if (!selfClosing) {
      while (!atEnd()) {
        if (startsWith("</")) {
          break;
        } else if (startsWith("<?")) {
          const end = xml.indexOf("?>", pos);
          pos = end === -1 ? xml.length : end + 2;
        } else if (startsWith("<!--")) {
          const end = xml.indexOf("-->", pos);
          pos = end === -1 ? xml.length : end + 3;
        } else if (xml[pos] === "<") {
          children.push(parseElement());
        } else {
          children.push(parseTextContent());
        }
      }

      if (startsWith("</")) {
        pos += 2;
        while (!atEnd() && xml[pos] !== ">") pos++;
        if (!atEnd()) pos++;
      }
    }

    return { type: "element", prefix, localName, attributes, namespaces, children };
  }

  if (startsWith("<?xml")) {
    const end = xml.indexOf("?>", pos);
    pos = end === -1 ? xml.length : end + 2;
    skipWs();
  }

  return parseElement();
}

function escapeC14nText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeC14nAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\t/g, "&#x9;")
    .replace(/\n/g, "&#xA;")
    .replace(/\r/g, "&#xD;");
}

function resolveNsUri(prefix: string, nsScope: Map<string, string>): string {
  if (prefix === "") return "";
  return nsScope.get(prefix) || "";
}

function c14nElement(
  elem: XmlElement,
  parentNsScope: Map<string, string>,
): string {
  const parts: string[] = [];

  parts.push("<");
  parts.push(elem.prefix ? `${elem.prefix}:${elem.localName}` : elem.localName);

  const myNsScope = new Map(parentNsScope);
  for (const ns of elem.namespaces) {
    myNsScope.set(ns.prefix, ns.uri);
  }

  const toRender: XmlNs[] = [];
  for (const [pfx, uri] of myNsScope) {
    const parentUri = parentNsScope.get(pfx);
    if (parentUri === undefined || parentUri !== uri) {
      toRender.push({ prefix: pfx, uri });
    }
  }

  toRender.sort((a, b) => {
    if (a.prefix === "" && b.prefix !== "") return -1;
    if (a.prefix !== "" && b.prefix === "") return 1;
    return a.prefix.localeCompare(b.prefix);
  });

  for (const ns of toRender) {
    if (ns.prefix === "") {
      parts.push(` xmlns="${escapeC14nAttr(ns.uri)}"`);
    } else {
      parts.push(` xmlns:${ns.prefix}="${escapeC14nAttr(ns.uri)}"`);
    }
  }

  const sortedAttrs = [...elem.attributes].sort((a, b) => {
    const aNsUri = resolveNsUri(a.prefix, myNsScope);
    const bNsUri = resolveNsUri(b.prefix, myNsScope);
    if (aNsUri !== bNsUri) return aNsUri.localeCompare(bNsUri);
    return a.localName.localeCompare(b.localName);
  });

  for (const attr of sortedAttrs) {
    const qname = attr.prefix ? `${attr.prefix}:${attr.localName}` : attr.localName;
    parts.push(` ${qname}="${escapeC14nAttr(attr.value)}"`);
  }

  parts.push(">");

  for (const child of elem.children) {
    if (child.type === "element") {
      parts.push(c14nElement(child, myNsScope));
    } else {
      parts.push(escapeC14nText(child.value));
    }
  }

  parts.push("</");
  parts.push(elem.prefix ? `${elem.prefix}:${elem.localName}` : elem.localName);
  parts.push(">");

  return parts.join("");
}

export function canonicalizeXml(xml: string): string {
  const tree = parseXml(xml);
  return c14nElement(tree, new Map());
}
