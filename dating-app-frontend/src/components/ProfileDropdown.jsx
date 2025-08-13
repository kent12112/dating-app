import {Menu} from "@headlessui/react";
import { Link } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

export default function ProfileDropdown() {
  return (
    <Menu as="div" className="relative inline-block text-left">
      {/* Trigger button */}
      <Menu.Button className="inline-flex items-center justify-center px-1 h-6 rounded-md bg-gray-100 hover:bg-gray-200">
        👤
      </Menu.Button>
      {/* Dropdown menu */}
      <Menu.Items className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div className="py-1">
          <Menu.Item>
            {({ active }) => (
                <Link
                  to="/app/edit-profile"
                  className={`${
                    active ? "bg-gray-100" : ""
                  } block px-4 py-2 text-sm text-gray-700`}
                >
                  Edit Profile
                </Link>
              )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
                <Link
                  to="/app/view-profile"
                  className={`${
                    active ? "bg-gray-100" : ""
                  } block px-4 py-2 text-sm text-gray-700`}
                >
                  View Profile
                </Link>
              )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                className={`${
                  active ? "bg-gray-100" : ""
                } block w-full text-left px-4 py-2 text-sm text-gray-700`}
              >
                Logout
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  )
}