import { DoorOpen, FlaskConical, MonitorCog } from 'lucide-react';
import { Link } from 'react-router-dom';

const resources = [
  {
    icon: DoorOpen,
    title: 'Meeting Rooms',
    description:
      'Reserve dedicated spaces for live troubleshooting, support discussions and collaborative problem-solving.',
  },
  {
    icon: FlaskConical,
    title: 'Technical Laboratories',
    description:
      'Schedule access to testing environments and laboratories for technical investigations.',
  },
  {
    icon: MonitorCog,
    title: 'Diagnostic Equipment',
    description:
      'Book shared diagnostic tools and specialized equipment without overlapping reservations.',
  },
];

const Resources = () => {
  return (
    <section id="resources" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-widest text-indigo-600 uppercase">
            Resource Management
          </span>

          <h2 className="mt-4 text-4xl font-bold text-slate-900">
            The right resource at the right time.
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Simplify access to shared internal resources with
            administrator-controlled availability and slot scheduling.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {resources.map((resource) => {
            const Icon = resource.icon;

            return (
              <div
                key={resource.title}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg"
              >
                <div className="flex h-40 items-center justify-center bg-linear-to-br from-indigo-100 to-sky-50">
                  <Icon
                    size={65}
                    strokeWidth={1.4}
                    className="text-indigo-600"
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    {resource.title}
                  </h3>

                  <p className="mt-3 leading-relaxed text-slate-600">
                    {resource.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-20 rounded-3xl bg-linear-to-r from-indigo-700 to-indigo-500 px-6 py-16 text-center text-white sm:px-12">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to transform your support workflow?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
            Bring your support tickets, agents and shared resources together
            with TriageSync.
          </p>

          <Link
            to="/register"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 font-semibold text-indigo-700 transition hover:bg-indigo-50"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Resources;
