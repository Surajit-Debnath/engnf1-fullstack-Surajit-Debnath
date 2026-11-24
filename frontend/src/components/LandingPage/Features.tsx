import {
  BrainCircuit,
  ListFilter,
  ShieldCheck,
  History,
  CalendarClock,
  Settings,
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "Automated Ticket Triage",
    description:
      "Automatically categorize incoming support tickets to reduce manual sorting and improve team efficiency.",
  },
  {
    icon: ListFilter,
    title: "Intelligent Prioritization",
    description:
      "Identify critical issues and prioritize tickets based on urgency, impact and classification rules.",
  },
  {
    icon: ShieldCheck,
    title: "Human Override Protection",
    description:
      "Empower support agents to review and override automated decisions without losing their manual changes.",
  },
  {
    icon: History,
    title: "Immutable Audit Trail",
    description:
      "Maintain a transparent history of ticket updates, classification decisions and agent actions.",
  },
  {
    icon: CalendarClock,
    title: "Resource Slot Scheduling",
    description:
      "Reserve rooms, laboratories and diagnostic equipment while preventing conflicting bookings.",
  },
  {
    icon: Settings,
    title: "Administrator Controls",
    description:
      "Manage internal resources, configure availability and oversee support operations from one platform.",
  },
];

const Features = () => {
  return (
    <section id="features" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-widest text-indigo-600 uppercase">
            Features
          </span>

          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            Everything your support team needs
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            One unified platform for managing tickets, reviewing
            decisions and scheduling shared resources.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <Icon size={28} />
                </div>

                <h3 className="mb-3 text-xl font-semibold text-slate-900">
                  {feature.title}
                </h3>

                <p className="leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;