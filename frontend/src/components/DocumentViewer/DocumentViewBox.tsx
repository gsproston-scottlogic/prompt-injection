import DocViewer, {
  DocViewerRef,
  DocViewerRenderers,
} from "@cyntler/react-doc-viewer";
import { useEffect, useRef, useState } from "react";

import "./DocumentViewBox.css";
import DocumentViewBoxHeader from "./DocumentViewBoxHeader";

import { DocumentMeta } from "@src/models/document";
import { getDocumentMetas } from "@src/service/documentService";

function DocumentViewBox({ closeOverlay }: { closeOverlay: () => void }) {
  const documentViewerRef = useRef<DocViewerRef>(null);

  const [documentMetas, setDocumentMetas] = useState<DocumentMeta[]>([]);
  const [activeDocument, setActiveDocument] = useState<DocumentMeta | null>(
    null
  );

  // on mount get document uris
  useEffect(() => {
    getDocumentMetas()
      .then((uris) => {
        setDocumentMetas(uris);
        if (uris.length > 0) {
          setActiveDocument(uris[0]);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  function getDocumentIndex() {
    return documentMetas.findIndex(
      (document) => document.filename === activeDocument?.filename
    );
  }

  function getDocumentName() {
    return activeDocument?.filename ?? "";
  }

  function onDocumentChange(document: DocumentMeta) {
    setActiveDocument(document);
  }

  return (
    <div className="document-popup-inner">
      <button
        className="prompt-injection-min-button close-button"
        onClick={closeOverlay}
        aria-label="close document viewer"
        title="close document viewer"
      >
        X
      </button>
      <DocumentViewBoxHeader
        documentIndex={getDocumentIndex()}
        documentName={getDocumentName()}
        numberOfDocuments={documentMetas.length}
        previousDocument={() => {
          documentViewerRef.current?.prev();
        }}
        nextDocument={() => {
          documentViewerRef.current?.next();
        }}
      />
      <div
        className="document-viewer-container"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <DocViewer
          ref={documentViewerRef}
          documents={documentMetas}
          activeDocument={activeDocument}
          pluginRenderers={DocViewerRenderers}
          config={{
            header: {
              disableHeader: true,
            },
          }}
          onDocumentChange={onDocumentChange}
        />
      </div>
    </div>
  );
}

export default DocumentViewBox;
