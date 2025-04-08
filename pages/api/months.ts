import { NextApiRequest, NextApiResponse } from "next";
import tzlookup from "tz-lookup";
import { DateTime } from "luxon";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // get query param： lon lat from to
    const { lon, lat, from, to } = req.query;

    // query param check
    const lonNum = parseFloat(lon as string);
    const latNum = parseFloat(lat as string);
    const startDate = new Date(from as string);
    const endDate = new Date(to as string);

    if (
      isNaN(lonNum) ||
      isNaN(latNum) ||
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime())
    ) {
      res.status(400).json({ error: "Invalid parameters" });
      return;
    }

    // 根据 lon 和 lat 获取时区
    let timeZone: string;
    try {
      timeZone = tzlookup(latNum, lonNum);
    } catch (error) {
      console.error("Error getting time zone:", error);
      res.status(500).json({ error: "Unable to get time zone" });
      return;
    }

    // 计算月份起始时间
    const months = [];
    const monthDiff =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());

    for (let i = 0; i <= monthDiff; i++) {
      const monthStart = DateTime.fromObject(
        {
          year: startDate.getFullYear(),
          month: startDate.getMonth() + 1 + i,
          day: 1,
        },
        { zone: timeZone }
      );

      const monthStartISO = monthStart.toISO();
      const monthStartUTCDate = monthStartISO ? new Date(monthStartISO) : null;
      const monthStartUTCString = monthStartUTCDate
        ? monthStartUTCDate.toISOString()
        : null;
      months.push(monthStartUTCString);
    }

    // 返回结果
    res.status(200).json({ monthStarts: months });
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
