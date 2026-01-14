import { MediaElement } from "@/types/timeline";
import { useTimelineStore } from "@/stores/timeline-store";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  PropertyItem,
  PropertyItemLabel,
  PropertyItemValue,
  PropertyGroup,
} from "./property-item";
import { RotateCcw } from "lucide-react";

export function MediaProperties({
  element,
  trackId,
}: {
  element: MediaElement;
  trackId: string;
}) {
  const { updateMediaElement } = useTimelineStore();

  const scale = element.scale ?? 1;
  const offsetX = element.offsetX ?? 0;
  const offsetY = element.offsetY ?? 0;

  const [scaleInput, setScaleInput] = useState(
    Math.round(scale * 100).toString()
  );
  const [offsetXInput, setOffsetXInput] = useState(
    Math.round(offsetX).toString()
  );
  const [offsetYInput, setOffsetYInput] = useState(
    Math.round(offsetY).toString()
  );

  // Sync input values when element properties change (e.g., from drag in preview)
  useEffect(() => {
    setScaleInput(Math.round(scale * 100).toString());
  }, [scale]);

  useEffect(() => {
    setOffsetXInput(Math.round(offsetX).toString());
  }, [offsetX]);

  useEffect(() => {
    setOffsetYInput(Math.round(offsetY).toString());
  }, [offsetY]);

  const parseAndValidateNumber = (
    value: string,
    min: number,
    max: number,
    fallback: number
  ): number => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  };

  const handleScaleChange = (value: string) => {
    setScaleInput(value);
    if (value.trim() !== "") {
      const scalePercent = parseAndValidateNumber(value, 1, 500, scale * 100);
      updateMediaElement(trackId, element.id, { scale: scalePercent / 100 });
    }
  };

  const handleScaleBlur = () => {
    const scalePercent = parseAndValidateNumber(
      scaleInput,
      1,
      500,
      scale * 100
    );
    setScaleInput(Math.round(scalePercent).toString());
    updateMediaElement(trackId, element.id, { scale: scalePercent / 100 });
  };

  const handleOffsetXChange = (value: string) => {
    setOffsetXInput(value);
    if (value.trim() !== "") {
      const newOffsetX = parseAndValidateNumber(value, -2000, 2000, offsetX);
      updateMediaElement(trackId, element.id, { offsetX: newOffsetX });
    }
  };

  const handleOffsetXBlur = () => {
    const newOffsetX = parseAndValidateNumber(
      offsetXInput,
      -2000,
      2000,
      offsetX
    );
    setOffsetXInput(Math.round(newOffsetX).toString());
    updateMediaElement(trackId, element.id, { offsetX: newOffsetX });
  };

  const handleOffsetYChange = (value: string) => {
    setOffsetYInput(value);
    if (value.trim() !== "") {
      const newOffsetY = parseAndValidateNumber(value, -2000, 2000, offsetY);
      updateMediaElement(trackId, element.id, { offsetY: newOffsetY });
    }
  };

  const handleOffsetYBlur = () => {
    const newOffsetY = parseAndValidateNumber(
      offsetYInput,
      -2000,
      2000,
      offsetY
    );
    setOffsetYInput(Math.round(newOffsetY).toString());
    updateMediaElement(trackId, element.id, { offsetY: newOffsetY });
  };

  const handleReset = () => {
    updateMediaElement(trackId, element.id, {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
    setScaleInput("100");
    setOffsetXInput("0");
    setOffsetYInput("0");
  };

  const hasTransform = scale !== 1 || offsetX !== 0 || offsetY !== 0;

  return (
    <div className="space-y-6 p-5">
      <PropertyGroup title="Transform">
        <div className="space-y-4">
          <PropertyItem direction="column">
            <PropertyItemLabel>Scale (%)</PropertyItemLabel>
            <PropertyItemValue>
              <div className="flex items-center gap-2">
                <Slider
                  value={[scale * 100]}
                  min={1}
                  max={500}
                  step={1}
                  onValueChange={([value]) => {
                    updateMediaElement(trackId, element.id, {
                      scale: value / 100,
                    });
                    setScaleInput(Math.round(value).toString());
                  }}
                  className="w-full"
                />
                <Input
                  type="number"
                  value={scaleInput}
                  min={1}
                  max={500}
                  onChange={(e) => handleScaleChange(e.target.value)}
                  onBlur={handleScaleBlur}
                  className="w-16 px-2 !text-xs h-7 rounded-sm text-center bg-panel-accent
                    [appearance:textfield]
                    [&::-webkit-outer-spin-button]:appearance-none
                    [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </PropertyItemValue>
          </PropertyItem>

          <PropertyItem direction="row">
            <PropertyItemLabel>Position X</PropertyItemLabel>
            <PropertyItemValue className="flex-none">
              <Input
                type="number"
                value={offsetXInput}
                onChange={(e) => handleOffsetXChange(e.target.value)}
                onBlur={handleOffsetXBlur}
                className="w-20 px-2 !text-xs h-7 rounded-sm text-center bg-panel-accent
                  [appearance:textfield]
                  [&::-webkit-outer-spin-button]:appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none"
              />
            </PropertyItemValue>
          </PropertyItem>

          <PropertyItem direction="row">
            <PropertyItemLabel>Position Y</PropertyItemLabel>
            <PropertyItemValue className="flex-none">
              <Input
                type="number"
                value={offsetYInput}
                onChange={(e) => handleOffsetYChange(e.target.value)}
                onBlur={handleOffsetYBlur}
                className="w-20 px-2 !text-xs h-7 rounded-sm text-center bg-panel-accent
                  [appearance:textfield]
                  [&::-webkit-outer-spin-button]:appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none"
              />
            </PropertyItemValue>
          </PropertyItem>

          {hasTransform && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="w-full"
              type="button"
            >
              <RotateCcw className="w-3 h-3 mr-2" />
              Reset Transform
            </Button>
          )}
        </div>
      </PropertyGroup>
    </div>
  );
}
