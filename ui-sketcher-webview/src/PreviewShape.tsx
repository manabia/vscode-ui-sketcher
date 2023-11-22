/* eslint-disable react-hooks/rules-of-hooks */
import {
  BaseBoxShapeUtil,
  DefaultSpinner,
  Editor,
  HTMLContainer,
  TLBaseShape,
  Vec2d,
  toDomPrecision,
  useIsEditing,
  useValue,
  TLShapeId,
  createShapeId,
} from "@tldraw/tldraw";

export type PreviewShape = TLBaseShape<
  "preview",
  {
    source: string;
    w: number;
    h: number;
  }
>;

export class PreviewShapeUtil extends BaseBoxShapeUtil<PreviewShape> {
  static override type = "preview" as const;

  getDefaultProps(): PreviewShape["props"] {
    return {
      source: "",
      w: (960 * 2) / 3,
      h: (540 * 2) / 3,
    };
  }

  override canEdit = () => true;
  override isAspectRatioLocked = (_shape: PreviewShape) => false;
  override canResize = (_shape: PreviewShape) => true;
  override canBind = (_shape: PreviewShape) => false;
  override canUnmount = () => false;

  override component(shape: PreviewShape) {
    const boxShadow = useValue(
      "box shadow",
      () => {
        const rotation = this.editor.getShapePageTransform(shape)!.rotation();
        return getRotatedBoxShadow(rotation);
      },
      [this.editor]
    );

    const isLoading = false;
    // @ts-expect-error TODO: remove this when stable v2
    const isEditing = useIsEditing();
    const { source } = shape.props;

    return (
      <HTMLContainer className="tl-embed-container" id={shape.id}>
        {isLoading ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "var(--color-culled)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow,
              border: "1px solid var(--color-panel-contrast)",
              borderRadius: "var(--radius-2)",
            }}
          >
            <DefaultSpinner />
          </div>
        ) : (
          <iframe
            src={source}
            width={toDomPrecision(shape.props.w)}
            height={toDomPrecision(shape.props.h)}
            draggable={false}
            style={{
              pointerEvents: isEditing ? "auto" : "none",
              boxShadow,
              border: "1px solid var(--color-panel-contrast)",
              borderRadius: "var(--radius-2)",
            }}
          />
        )}
      </HTMLContainer>
    );
  }

  indicator(shape: PreviewShape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}

// todo: export these from tldraw

const ROTATING_BOX_SHADOWS = [
  {
    offsetX: 0,
    offsetY: 2,
    blur: 4,
    spread: -1,
    color: "#0000003a",
  },
  {
    offsetX: 0,
    offsetY: 3,
    blur: 12,
    spread: -2,
    color: "#0000001f",
  },
];

function getRotatedBoxShadow(rotation: number) {
  const cssStrings = ROTATING_BOX_SHADOWS.map((shadow) => {
    const { offsetX, offsetY, blur, spread, color } = shadow;
    const vec = new Vec2d(offsetX, offsetY);
    const { x, y } = vec.rot(-rotation);
    return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
  });
  return cssStrings.join(", ");
}

export const displayPreviewShape = (
  editor: Editor,
  shapeId: string | TLShapeId,
  source: string
) => {
  const id = typeof shapeId === "string" ? createShapeId(shapeId) : shapeId;
  if (editor.getShape(id)) return;

  const { x, y } = editor.getViewportPageCenter();
  const w = (960 * 2) / 3;
  const h = (540 * 2) / 3;

  // 16.9 aspect ratio
  editor.createShape<PreviewShape>({
    id,
    type: "preview",
    x: x - w / 2,
    y: y - h / 2,
    props: { source, w, h },
  });

  editor.sendToBack([id]);
};
