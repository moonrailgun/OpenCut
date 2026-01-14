import { DraggableMediaItem } from "@/components/ui/draggable-item";
import { PanelBaseView as BaseView } from "@/components/editor/panel-base-view";
import { useTimelineStore } from "@/stores/timeline-store";
import { DEFAULT_TEXT_ELEMENT } from "@/constants/text-constants";
import {
  SUBTITLE_TEMPLATES,
  createSubtitleFromTemplate,
  SubtitleTemplate,
} from "@/constants/subtitle-constants";
import { TextElement } from "@/types/timeline";

function SubtitlePreview({ template }: { template: SubtitleTemplate }) {
  const getVerticalPosition = () => {
    if (template.y < -100) {
      return "items-start pt-1";
    }
    if (template.y > 100) {
      return "items-end pb-1";
    }
    return "items-center";
  };

  return (
    <div
      className={`flex justify-center w-full h-full bg-zinc-800 rounded ${getVerticalPosition()}`}
    >
      <span
        className="text-[8px] px-1 max-w-full truncate select-none"
        style={{
          color: template.color,
          backgroundColor: template.backgroundColor,
          fontWeight: template.fontWeight,
          fontStyle: template.fontStyle,
          opacity: template.opacity,
        }}
      >
        {template.templateName}
      </span>
    </div>
  );
}

export function TextView() {
  const { addElementAtTime } = useTimelineStore();

  const handleAddSubtitle = (template: SubtitleTemplate, currentTime: number) => {
    const subtitleElement = createSubtitleFromTemplate(template, currentTime);
    addElementAtTime(subtitleElement as TextElement, currentTime);
  };

  return (
    <BaseView className="space-y-4">
      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">
          Default Text
        </h3>
        <DraggableMediaItem
          name="Default text"
          preview={
            <div className="flex items-center justify-center w-full h-full bg-panel-accent rounded">
              <span className="text-xs select-none">Default text</span>
            </div>
          }
          dragData={{
            id: "temp-text-id",
            type: DEFAULT_TEXT_ELEMENT.type,
            name: DEFAULT_TEXT_ELEMENT.name,
            content: DEFAULT_TEXT_ELEMENT.content,
          }}
          aspectRatio={1}
          onAddToTimeline={(currentTime) =>
            useTimelineStore.getState().addElementAtTime(
              {
                ...DEFAULT_TEXT_ELEMENT,
                id: "temp-text-id",
              },
              currentTime
            )
          }
          showLabel={false}
        />
      </div>

      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">
          Subtitle Templates
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {SUBTITLE_TEMPLATES.map((template) => (
            <DraggableMediaItem
              key={template.templateId}
              name={template.templateName}
              preview={<SubtitlePreview template={template} />}
              dragData={{
                id: `subtitle-${template.templateId}`,
                type: "text" as const,
                name: template.name,
                content: template.content,
              }}
              aspectRatio={16 / 9}
              containerClassName="w-full"
              onAddToTimeline={(currentTime) =>
                handleAddSubtitle(template, currentTime)
              }
              showLabel={true}
            />
          ))}
        </div>
      </div>
    </BaseView>
  );
}
