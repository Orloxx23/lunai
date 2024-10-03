import React from "react";
import UserMenu from "./UserMenu";
import { CommandDialogSearch } from "./command-dialog";

export default function Topbar() {
  return (
    <div className="h-[10vh] py-4 px-8 flex items-center">
      <CommandDialogSearch />
      <div className="flex-1"></div>
      <div className="flex items-center gap-4">
        <button className="relative border hover:border-indigo-600 duration-500 group cursor-pointer text-indigo-50  overflow-hidden h-11 w-40 rounded-md bg-indigo-800 p-2 flex justify-center items-center font-extrabold">
          <div className="absolute z-10 w-48 h-48 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-900 delay-150 group-hover:delay-75"></div>
          <div className="absolute z-10 w-40 h-40 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-800 delay-150 group-hover:delay-100"></div>
          <div className="absolute z-10 w-32 h-32 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-700 delay-150 group-hover:delay-150"></div>
          <div className="absolute z-10 w-24 h-24 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-600 delay-150 group-hover:delay-200"></div>
          <div className="absolute z-10 w-16 h-16 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-500 delay-150 group-hover:delay-300"></div>
          <p className="z-10">Crear</p>
        </button>

        <UserMenu />
      </div>
    </div>
  );
}
