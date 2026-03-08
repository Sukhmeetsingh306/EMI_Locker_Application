// src/components/ui/Card.jsx
'use client';

import Link from 'next/link';

const Card = ({ title, value, helper, icon, href, onClick }) => {
  const content = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-zinc-500">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{value}</p>
        {helper && <p className="mt-1 text-xs text-zinc-500">{helper}</p>}
      </div>
      {icon && <span className="rounded-full bg-zinc-100 p-3 text-zinc-600 dark:bg-zinc-800">{icon}</span>}
    </div>
  );

  const cardClasses = "rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-700";

  if (href) {
    return (
      <Link href={href} className={cardClasses + " block cursor-pointer"}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={onClick} className={cardClasses + " cursor-pointer"}>
        {content}
      </div>
    );
  }

  return (
    <div className={cardClasses}>
      {content}
    </div>
  );
};

export default Card;




