import { Link } from "react-router-dom";

export function HowItWorksSection() {
  const steps = [
    {
      id: 1,
      title: "Calibrate & Center",
      text: "Open the camera, center your face, and let the system detect your gaze before starting the maze.",
    },
    {
      id: 2,
      title: "Control with Your Eyes",
      text: "Move through the maze using only gaze direction—up, down, left, right—no keyboard or mouse needed.",
    },
    {
      id: 3,
      title: "Train Focus & Alignment",
      text: "Each move trains fixation, tracking, and binocular alignment in a playful, low-friction way.",
    },
    {
      id: 4,
      title: "Review Progress",
      text: "Track session duration, maze difficulty, and completion to monitor visual performance over time.",
    },
  ];

  return (
    <section
      className="w-full bg-[#03245b] text-white px-4 py-12 md:py-16"
      id=""
    >
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.2fr_1fr] items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            How Our
            <span className="block text-blue-300">Gaze Maze Therapy Works</span>
          </h2>
          <p className="text-sm md:text-base text-blue-100 mb-6 max-w-xl">
            We combine real-time gaze tracking with maze-based challenges to
            transform amblyopia and strabismus exercises into an engaging,
            game-like experience.
          </p>
          <div className="flex items-center bg-white rounded-full px-4 py-2 max-w-md shadow-lg mb-8">
            <input
              type="text"
              placeholder="Search: amblyopia, strabismus, therapy..."
              className="flex-1 text-xs md:text-sm text-slate-700 bg-transparent outline-none"
              readOnly
            />
            <button className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
              <span className="text-white text-lg md:text-xl">🔍</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className="bg-[#062e74] rounded-2xl px-4 py-4 md:px-5 md:py-5 shadow-lg border border-blue-700/40"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold">
                    {step.id}
                  </div>
                  <h3 className="text-sm md:text-base font-semibold">
                    {step.title}
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-blue-100 leading-relaxed">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-[#06357f] rounded-3xl px-6 py-6 shadow-2xl border border-blue-700/50">
            <p className="text-xs uppercase tracking-[0.22em] text-blue-200 mb-2">
              therapy snapshot
            </p>
            <p className="text-5xl font-bold mb-1">15–20</p>
            <p className="text-sm text-blue-100 mb-4">
              minutes per session is all it takes to complete one maze set and
              log trackable eye-training data.
            </p>
            <Link
              to="/playground"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-blue-700 px-4 py-2 rounded-full shadow-md hover:bg-blue-50 transition"
            >
              Start a Training Session
              <span aria-hidden>🎮</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-[#06357f] rounded-2xl py-4 shadow-lg">
              <p className="text-3xl font-bold">4+</p>
              <p className="text-xs mt-1 text-blue-100 px-3">
                gaze-driven movement patterns
              </p>
            </div>
            <div className="bg-[#06357f] rounded-2xl py-4 shadow-lg">
              <p className="text-3xl font-bold">Adaptive</p>
              <p className="text-xs mt-1 text-blue-100 px-3">
                maze size & difficulty scaling
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhoItHelpsSection() {
  const groups = [
    {
      label: "Amblyopia (Lazy Eye)",
      desc: "Helps keep the weaker eye engaged with focused maze navigation and sustained fixation tasks.",
      tag: "Focus & fixation",
    },
    {
      label: "Strabismus (Eye Turn)",
      desc: "Supports binocular alignment by encouraging both eyes to track the same moving target through the maze.",
      tag: "Alignment & coordination",
    },
    {
      label: "Pediatric Vision Therapy",
      desc: "Turns repetitive eye exercises into a game, improving motivation and adherence for kids and teens.",
      tag: "Gamified training",
    },
    {
      label: "Home & Clinic Use",
      desc: "Designed for therapists in clinics and families at home looking for structured digital vision training.",
      tag: "Flexible deployment",
    },
  ];

  return (
    <section className="w-full bg-white px-4 py-12 md:py-16" id="who-it-helps">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Who it helps
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
              Built for Real
              <span className="block text-blue-600">
                Vision Therapy Scenarios
              </span>
            </h2>
          </div>
          <p className="text-sm md:text-base text-slate-600 max-w-xl">
            Whether you’re a clinician, parent, or learner, the maze is tuned to
            support structured, repeatable eye-training sessions with measurable
            progress.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <div
              key={g.label}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 transition shadow-sm px-4 py-5 flex flex-col justify-between"
            >
              <div>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-[10px] font-semibold uppercase tracking-wide text-blue-700 mb-3">
                  {g.tag}
                </span>
                <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-2">
                  {g.label}
                </h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  {g.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesBenefitsSection() {
  const features = [
    {
      stat: "Real-time",
      label: "Gaze-Driven Control",
      text: "Move through the maze purely with eye direction, improving control over saccades and smooth pursuits.",
    },
    {
      stat: "Adaptive",
      label: "Difficulty & Maze Size",
      text: "Scale maze complexity and path length to match the patient’s comfort and therapy stage.",
    },
    {
      stat: "Alerts",
      label: "Off-Center Detection",
      text: "Instant feedback when the user drifts off-center, encouraging better posture and eye positioning.",
    },
    {
      stat: "Analytics",
      label: "Session Insights",
      text: "Track completion time, errors, and repeats to give therapists a meaningful view of progress.",
    },
  ];

  return (
    <section
      className="w-full bg-[#021a40] text-white px-4 py-12 md:py-16"
      id="features"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
              Features & benefits
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mt-2">
              Designed for
              <span className="block text-blue-300">
                Consistent Eye-Training
              </span>
            </h2>
          </div>
          <p className="text-sm md:text-base text-blue-100 max-w-xl">
            Every interaction—from wall colors to alerts—is crafted to keep the
            user engaged while reinforcing the visual skills that matter in
            amblyopia and strabismus therapy.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.label}
              className="bg-[#03245b] rounded-2xl px-4 py-5 md:px-5 md:py-6 shadow-xl border border-blue-700/40 flex flex-col justify-between"
            >
              <div className="mb-3">
                <p className="text-2xl md:text-3xl font-bold mb-1">{f.stat}</p>
                <p className="text-xs md:text-sm font-semibold text-blue-200">
                  {f.label}
                </p>
              </div>
              <p className="text-xs md:text-sm text-blue-100 leading-relaxed">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomeSections() {
  return (
    <>
      <HowItWorksSection />
      <WhoItHelpsSection />
      <FeaturesBenefitsSection />
    </>
  );
}
