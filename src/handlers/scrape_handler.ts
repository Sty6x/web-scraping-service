import { t_task } from "../types/project_types";
import { ScraperInterface as Scraper } from "../services/scraper_interface";
import { Request, Response } from "express";

export default async (req: Request, res: Response) => {
  const session = req.session;
  const sess_store = req.sessionStore;
  const parsed_task: t_task = req.body.parsedData;
  try {
    const scraper = new Scraper(parsed_task);
    await scraper.initialize_scraper();
    const new_task = await scraper.single_page();
    if (req.cookies["connect.sid"] === undefined) {
      res.json({
        is_downloadable: false,
        Message: "Session Does not exist.",
        session_expired: true,
      });
      return;
    }
    sess_store.get(session.id, (err, session_data) => {
      if (err) res.json({ Message: err });
      if (session_data === null || session_data === undefined) {
        res.json({
          is_downloadable: false,
          Message: "Session Expired",
          session_expired: true,
        });
      }
      const update_tasks = [
        new_task,
        ...(session_data?.tasks as Array<t_task>),
      ];
      session.tasks = update_tasks;
      res.json({
        is_downloadable: true,
        Message: "Success",
        taskID: new_task.taskID,
        task: new_task,
        session_expired: false,
      });
    });
  } catch (e) {
    console.error(e);
    res.json({
      is_downloadable: false,
      Message: "Something went wrong with your request.",
      session_expired: false,
    });
  }
};
