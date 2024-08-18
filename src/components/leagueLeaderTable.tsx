import React from 'react';

const LeagueLeaderTable = (props: { names: Array<string>; title: string }) => {
  return (
    <div className='mx-auto mt-5'>
      <h1 className='text-xl text-center mb-3'>{props.title}</h1>
      <ol className='border border-black dark:border-white rounded px-8 list-decimal'>
        {props.names.map((name, index) => {
          return (
            <li key={index} className='p-1'>
              {name}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default LeagueLeaderTable;
