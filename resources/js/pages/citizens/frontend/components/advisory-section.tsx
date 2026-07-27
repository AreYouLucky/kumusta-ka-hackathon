import { Clock3, CloudRainWind, MapPin, TriangleAlert } from 'lucide-react';
import type { JSX } from 'react';

import type { WeatherAdvisory } from '../types';

type AdvisorySectionProps = {
    advisory: WeatherAdvisory;
};

export function AdvisorySection({ advisory }: AdvisorySectionProps): JSX.Element {
    return (
        <section id="advisory" aria-labelledby="advisory-title" className="scroll-mt-6 pt-4 sm:pt-6">
            <div className="flex items-center gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-700">
                    <CloudRainWind className="size-6" aria-hidden="true" />
                </div>
                <div>
                    <h2 id="advisory-title" className="text-xl font-extrabold tracking-tight text-black">
                        Weather Advisory
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">Monitor possible hazards near your area.</p>
                </div>
            </div>

            <article className="mt-5 overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-[0_8px_24px_rgba(234,88,12,0.08)] md:grid md:grid-cols-[0.9fr_1.1fr]">
                <figure className="relative bg-sky-100">
                    <img src={advisory.mapImage} alt={advisory.mapAlt} className="aspect-[3/4] h-full w-full object-cover object-center" />
                    <figcaption className="absolute right-3 bottom-3 left-3 rounded-lg bg-black/65 px-3 py-2 text-[10px] font-semibold text-white backdrop-blur-sm">
                        impact visualization — not an official forecast map
                    </figcaption>
                </figure>

                <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-red-700">
                            {advisory.status}
                        </span>
                        <TriangleAlert className="size-5 text-orange-600" aria-hidden="true" />
                    </div>

                    <h3 className="mt-4 text-xl font-extrabold tracking-tight text-black sm:text-2xl">{advisory.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{advisory.description}</p>

                    <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock3 className="size-4" aria-hidden="true" />
                        {advisory.updatedAt}
                    </div>

                    <div className="mt-5">
                        <p className="text-xs font-extrabold tracking-wide text-slate-700 uppercase">Possible impact areas</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {advisory.impactAreas.map((area) => (
                                <span
                                    key={area}
                                    className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700"
                                >
                                    <MapPin className="size-3.5" aria-hidden="true" />
                                    {area}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50 p-4">
                        <p className="text-sm font-extrabold text-sky-800">Prepare while conditions are calm</p>
                        <p className="mt-1 text-xs leading-relaxed text-sky-700">
                            Charge devices, secure outdoor items, review evacuation routes, and monitor official advisories.
                        </p>
                    </div>
                </div>
            </article>
        </section>
    );
}
