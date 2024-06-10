"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Registration } from "~~/enslibrary/components/@molecules/Register/Registration";
import { useBasicName } from "~~/hooks/ens-hook/useBasicName";

const useInitial = () => {
  const [initial, setInitial] = useState(true);

  useEffect(() => setInitial(false), []);

  return initial;
};

const Register = ({ params }: { params: { slug: string } }) => {
  const { address: connectedAddress } = useAccount();

  const initial = useInitial();

  const name = params.slug;
  const nameDetails = useBasicName({ name });

  const { isLoading: detailsLoading, registrationStatus } = nameDetails;

  const isLoading = detailsLoading || initial;

  useEffect(() => {
    console.log(registrationStatus, isLoading);
  }, [registrationStatus]);

  if (!isLoading && registrationStatus !== "available" && registrationStatus !== "premium") {
    return (
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="font-head  text-blue-500  font-semibold container text-center text-4xl py-10">
            Registration page
          </h1>
          <div className="font-head  text-blue-500  font-semibold ">Registered</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="font-head  text-blue-500  font-semibold container text-center text-4xl py-10">
            Registration page
          </h1>

          <Registration {...{ nameDetails, isLoading }} />
        </div>
      </div>
    </>
  );
};

export default Register;
