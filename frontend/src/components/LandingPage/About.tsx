import {
  Inbox,
  BrainCircuit,
  UserCheck,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";

const steps = [
  {
    icon: Inbox,
    title: "Receive Tickets",
    description: "Collect incoming support requests.",
  },
  {
    icon: BrainCircuit,
    title: "Automated Triage",
    description: "Assign categories and priority levels.",
  },
  {
    icon: UserCheck,
    title: "Agent Review",
    description: "Review and override automated decisions.",
  },
  {
    icon: CalendarCheck,
    title: "Schedule Resources",
    description: "Book available time slots when required.",
  },
  {
    icon: CheckCircle2,
    title: "Resolve Tickets",
    description: "Complete requests with traceable history.",
  },
];

const About = () => {
  return (
    <section id="about" className="bg-white py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">

        {/* About Content */}
        <div>
          <span className="text-sm font-semibold tracking-widest text-indigo-600 uppercase">
            About TriageSync
          </span>

          <h2 className="mt-4 text-4xl leading-tight font-bold text-slate-900">
            Bringing clarity to complex support operations.
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Support teams receive hundreds of requests every day.
            Managing priorities, reviewing decisions and coordinating
            shared resources manually can lead to delays and confusion.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            TriageSync connects automated ticket triage with
            human-controlled decision-making and resource scheduling
            in a single, organized workspace.
          </p>

          <div className="mt-8 space-y-4">
            {[
              "Reduce repetitive manual ticket sorting",
              "Keep support agents in control",
              "Prevent resource scheduling conflicts",
              "Maintain transparent and accountable operations",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2
                  size={20}
                  className="shrink-0 text-indigo-600"
                />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow */}
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <h3 className="mb-8 text-xl font-bold text-slate-900">
            How TriageSync Works
          </h3>

          <div className="space-y-5">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="relative flex gap-4">
                  {index !== steps.length - 1 && (
                    <div className="absolute top-12 left-6 h-full w-px bg-indigo-200" />
                  )}

                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <Icon size={23} />
                  </div>

                  <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-indigo-600">
                      STEP 0{index + 1}
                    </p>

                    <h4 className="mt-1 font-semibold text-slate-900">
                      {step.title}
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;