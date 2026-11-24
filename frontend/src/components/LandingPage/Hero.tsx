import {
  Zap,
  ShieldCheck,
  CalendarCheck,
  Ticket,
  CircleCheck,
  Ellipsis,
} from 'lucide-react';

const tickets = [
  {
    id: 'TK-1024',
    title: 'Network connectivity issue',
    priority: 'High',
    color: 'bg-red-100 text-red-700',
  },
  {
    id: 'TK-1025',
    title: 'Software installation',
    priority: 'Medium',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'TK-1026',
    title: 'Diagnostic lab access',
    priority: 'Low',
    color: 'bg-emerald-100 text-emerald-700',
  },
];

const Hero = () => {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-linear-to-br from-indigo-50 via-white to-sky-50 pt-36 pb-24 lg:pt-48 lg:pb-32"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
        {/* Left Content */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
            <Zap size={16} />
            Intelligent Support Management
          </div>

          <h1 className="text-5xl leading-tight font-bold tracking-tight text-slate-900 lg:text-6xl">
            Smarter triage.
            <br />
            Seamless
            <span className="text-indigo-600"> scheduling.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Streamline your support operations with automated ticket
            classification, intelligent prioritization, human oversight and
            conflict-free resource scheduling.
          </p>

          <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-indigo-600" />
              Human-controlled
            </span>

            <span className="flex items-center gap-2">
              <CalendarCheck size={18} className="text-indigo-600" />
              Conflict-free booking
            </span>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="rounded-3xl border border-indigo-100 bg-indigo-100/40 p-4 shadow-2xl shadow-indigo-200/50">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Support Overview
                </h2>
                <p className="text-sm text-slate-500">Your support workspace</p>
              </div>

              <Ellipsis className="text-slate-400" />
            </div>

            {/* Statistics */}
            <div className="mb-8 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-indigo-50 p-4">
                <Ticket className="mb-3 text-indigo-600" />
                <p className="text-sm text-slate-500">Open Tickets</p>
                <h3 className="text-3xl font-bold text-indigo-700">128</h3>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <CircleCheck className="mb-3 text-emerald-600" />
                <p className="text-sm text-slate-500">Resolved Tickets</p>
                <h3 className="text-3xl font-bold text-emerald-700">96</h3>
              </div>
            </div>

            {/* Recent Tickets */}
            <h3 className="mb-4 font-semibold text-slate-800">
              Recent Tickets
            </h3>

            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Ticket size={18} className="text-slate-400" />

                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-slate-400">{ticket.id}</p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${ticket.color}`}
                  >
                    {ticket.priority}
                  </span>
                </div>
              ))}
            </div>

            {/* Booking Preview */}
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <CalendarCheck className="shrink-0 text-indigo-600" />

              <div>
                <p className="text-sm font-semibold text-indigo-900">
                  Upcoming Resource Booking
                </p>
                <p className="text-xs text-indigo-600">
                  Diagnostic Lab · 10:00 AM – 11:00 AM
                </p>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Illustrative dashboard preview
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
