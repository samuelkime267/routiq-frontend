"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import Button from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import { SelectField, TextField } from "@/components/ui/FormField";
import { NIGERIAN_STATES } from "../constants";
import type { StepProps } from "../model";

export default function LocationStep({
  register,
  errors,
  setValue,
}: StepProps) {
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationNote("Location is not available in this browser.");
      return;
    }

    setLocating(true);
    setLocationNote(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("longitude", position.coords.longitude.toFixed(6), {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue("latitude", position.coords.latitude.toFixed(6), {
          shouldDirty: true,
          shouldValidate: true,
        });
        setLocationNote("Coordinates added. Adjust them if needed.");
        setLocating(false);
      },
      () => {
        setLocationNote("We could not read your location. Enter it manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Street address"
          placeholder="12 Adeola Odeku Street"
          fieldClassName="sm:col-span-2"
          error={errors.address?.street?.message}
          register={register("address.street")}
        />

        <TextField
          label="City"
          placeholder="Ikeja"
          error={errors.address?.city?.message}
          register={register("address.city")}
        />

        <TextField
          label="Local government area"
          placeholder="Ikeja"
          error={errors.address?.lga?.message}
          register={register("address.lga")}
        />

        <SelectField
          label="State"
          placeholder="Select a state"
          options={NIGERIAN_STATES.map((state) => ({
            value: state,
            label: state,
          }))}
          error={errors.address?.state?.message}
          register={register("address.state")}
        />

        <Field label="Country" htmlFor="country">
          <Input id="country" value="Nigeria" disabled />
        </Field>

        <TextField
          label="Nearest landmark"
          placeholder="Opposite the market gate"
          optional
          error={errors.address?.landmark?.message}
          register={register("address.landmark")}
        />

        <TextField
          label="Postal code"
          inputMode="numeric"
          placeholder="100001"
          optional
          error={errors.address?.postalCode?.message}
          register={register("address.postalCode")}
        />
      </div>

      <div className="rounded-2xl border border-line bg-soft/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Store pin
            </p>
            <p className="mt-1 text-[12px] text-muted">
              Used to estimate delivery distance and surface you nearby.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={locating}
            icon={<Icon name="map-pin" className="size-3.5" />}
            onClick={useCurrentLocation}
          >
            Use my location
          </Button>
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <TextField
            label="Longitude"
            inputMode="decimal"
            placeholder="3.379200"
            error={errors.longitude?.message}
            register={register("longitude")}
          />

          <TextField
            label="Latitude"
            inputMode="decimal"
            placeholder="6.524400"
            error={errors.latitude?.message}
            register={register("latitude")}
          />
        </div>

        {locationNote ? (
          <p className="mt-2 text-[11px] text-muted">{locationNote}</p>
        ) : null}
      </div>

      <TextField
        label="Pickup instructions"
        optional
        placeholder="Enter through the side gate and ask for the dispatch desk."
        hint="Help riders find your entrance, gate, or loading bay."
        error={errors.pickupInstructions?.message}
        register={register("pickupInstructions")}
      />
    </div>
  );
}
