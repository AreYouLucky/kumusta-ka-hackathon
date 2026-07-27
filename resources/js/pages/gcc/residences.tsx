import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Baby, Calendar, HeartPulse, Home, MapPin, PersonStanding, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Residences', href: '/gcc/residences' }];

type Residence = {
    id: number;
    resident_code: string | null;
    full_name: string;
    birthdate: string | null;
    age: number | null;
    sex: string | null;
    is_pwd: boolean;
    is_pregnant: boolean;
    pregnancy_month: number | null;
    household_number: string | null;
    contact_number: string | null;
    city: string | null;
    barangay: string | null;
    purok: string | null;
    street: string | null;
    address_line: string | null;
    latitude: number;
    longitude: number;
    has_health_problem: boolean;
    health_problem_details: string | null;
};

type Summary = {
    total: number;
    mapped: number;
    barangays: number;
    with_birthdate: number;
    pwd: number;
    pregnant: number;
    with_health_problem: number;
};

export default function Residences({ residences = [], summary }: { residences?: Residence[]; summary: Summary }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Residences" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <section>
                    <h1 className="text-xl font-semibold">Residences</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Master list of residents with mapped home coordinates for future disaster-radius matching.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-7">
                    <SummaryTile icon={Users} label="Residents" value={summary.total} />
                    <SummaryTile icon={MapPin} label="Mapped" value={summary.mapped} />
                    <SummaryTile icon={Home} label="Barangays" value={summary.barangays} />
                    <SummaryTile icon={Calendar} label="With Birthdate" value={summary.with_birthdate} />
                    <SummaryTile icon={PersonStanding} label="PWD" value={summary.pwd} />
                    <SummaryTile icon={Baby} label="Pregnant" value={summary.pregnant} />
                    <SummaryTile icon={HeartPulse} label="Health Risk" value={summary.with_health_problem} />
                </section>

                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle className="text-base">Resident Location List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-md border">
                            <div className="grid grid-cols-[1.2fr_80px_1.3fr_170px_130px_190px] gap-3 bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                                <span>Resident</span>
                                <span>Age</span>
                                <span>Address</span>
                                <span>Coordinates</span>
                                <span>Contact</span>
                                <span>Demographics</span>
                            </div>
                            {residences.length ? (
                                residences.map((residence) => (
                                    <div key={residence.id} className="grid grid-cols-[1.2fr_80px_1.3fr_170px_130px_190px] gap-3 border-t px-3 py-3 text-sm">
                                        <div>
                                            <div className="font-medium">{residence.full_name || 'Unnamed resident'}</div>
                                            <div className="text-xs text-muted-foreground">{residence.resident_code || residence.household_number || 'No code'}</div>
                                        </div>
                                        <span>{residence.age ?? '-'}</span>
                                        <span className="text-muted-foreground">
                                            {[residence.address_line, residence.purok, residence.barangay, residence.city].filter(Boolean).join(', ') || '-'}
                                        </span>
                                        <span className="font-mono text-xs">
                                            {residence.latitude}, {residence.longitude}
                                        </span>
                                        <span>{residence.contact_number || '-'}</span>
                                        <span className="flex flex-wrap gap-1">
                                            {residence.is_pwd && <Badge variant="secondary">PWD</Badge>}
                                            {residence.is_pregnant && <Badge variant="secondary">Pregnant</Badge>}
                                            {residence.has_health_problem && <Badge variant="secondary">{residence.health_problem_details || 'Health risk'}</Badge>}
                                            {!residence.is_pwd && !residence.is_pregnant && !residence.has_health_problem && '-'}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="border-t px-3 py-8 text-center text-sm text-muted-foreground">No resident records yet.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function SummaryTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
    return (
        <Card className="rounded-lg">
            <CardContent className="flex items-center justify-between p-4">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-semibold">{value}</p>
                </div>
                <Icon className="size-6 text-primary" />
            </CardContent>
        </Card>
    );
}
